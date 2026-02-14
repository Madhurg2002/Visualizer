import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PendulumState, PendulumSegment } from './PendulumPhysics';
import PendulumCanvas from './PendulumCanvas';
import PendulumControls from './PendulumControls';

const Pendulum = () => {
    // Initial Configuration
    const [config, setConfig] = useState({
        gravity: 1,
        damping: 0.005,
        trailLength: 200,
        pendulums: [
            { mass: 10, length: 150, angle: Math.PI / 2, velocity: 0 },
            { mass: 10, length: 150, angle: Math.PI / 2, velocity: 0 }
        ]
    });

    const [paused, setPaused] = useState(false);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                setPaused(p => !p);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const [coords, setCoords] = useState([]);
    const [currentAngles, setCurrentAngles] = useState([]);
    const [currentVelocities, setCurrentVelocities] = useState([]);
    const [fps, setFps] = useState(0);
    const [trail, setTrail] = useState([]);

    // Physics State Ref (mutable for performance loop)
    const physicsRef = useRef(new PendulumState([
        { mass: 10, length: 150, angle: Math.PI / 2, velocity: 0 },
        { mass: 10, length: 150, angle: Math.PI / 2, velocity: 0 }
    ]));
    const requestRef = useRef();
    const lastTimeRef = useRef();
    const frameCountRef = useRef(0);
    const lastFpsTimeRef = useRef(0);

    // Sync physics engine with React config config when it changes significantly
    // (e.g., number of pendulums or hard reset)
    // Dynamic Segment Update (Smart Diffing)
    useEffect(() => {
        const pState = physicsRef.current;
        const currentLen = pState.segments.length;
        const targetLen = config.pendulums.length;

        if (currentLen !== targetLen) {
            // Add new segments
            if (targetLen > currentLen) {
                for (let i = currentLen; i < targetLen; i++) {
                    const conf = config.pendulums[i];
                    pState.segments.push(new PendulumSegment(conf));
                }
            }
            // Remove segments
            else {
                pState.segments.splice(targetLen, currentLen - targetLen);
            }

            pState.n = pState.segments.length;
            setCoords(pState.getCoordinates());
        }
    }, [config.pendulums.length]);

    // Update params on the fly
    useEffect(() => {
        const p = physicsRef.current;
        p.g = config.gravity;
        p.damping = config.damping;

        // Update segment properties
        if (p.segments && p.segments.length === config.pendulums.length) {
            p.segments.forEach((seg, i) => {
                seg.length = config.pendulums[i].length;
                seg.mass = config.pendulums[i].mass;
            });
        }
    }, [config]);

    const animate = (time) => {
        if (paused) {
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        if (lastTimeRef.current === undefined) lastTimeRef.current = time;
        const deltaTime = (time - lastTimeRef.current); // ms
        lastTimeRef.current = time;

        // Physics Sub-stepping for Stability
        // Instead of one large step, do multiple small steps
        const simDt = 0.4; // Simulation speed factor
        const subSteps = 10;
        const subDt = simDt / subSteps;

        for (let i = 0; i < subSteps; i++) {
            physicsRef.current.solve(subDt);
        }

        const currentCoords = physicsRef.current.getCoordinates();
        setCoords(currentCoords);
        setCurrentAngles(physicsRef.current.segments.map(s => s.angle));
        setCurrentVelocities(physicsRef.current.segments.map(s => s.velocity));

        // Update Trail (track the last pendulum bob)
        if (config.trailLength > 0) {
            const tail = currentCoords[currentCoords.length - 1];
            setTrail(prev => {
                const newTrail = [...prev, tail];
                if (newTrail.length > config.trailLength) {
                    return newTrail.slice(newTrail.length - config.trailLength);
                }
                return newTrail;
            });
        } else {
            setTrail([]);
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [paused]); // Restart loop if pause state toggles (logic handled inside animate for smoothness)

    const handleReset = () => {
        physicsRef.current = new PendulumState(config.pendulums);
        physicsRef.current.damping = config.damping;
        physicsRef.current.g = config.gravity;

        setTrail([]);
        setCoords(physicsRef.current.getCoordinates());
        setCurrentAngles(physicsRef.current.segments.map(s => s.angle));
        setCurrentVelocities(physicsRef.current.segments.map(s => s.velocity));
    };

    const handleAngleChange = (index, angleRad) => {
        // Direct physics update for smooth interaction
        if (physicsRef.current && physicsRef.current.segments[index]) {
            physicsRef.current.segments[index].angle = angleRad;
            physicsRef.current.segments[index].velocity = 0; // consistent 'grab' feel

            // Also force update coords immediately so visual feedback is instant
            setCoords(physicsRef.current.getCoordinates());

            // Update currentAngles so UI sliders strictly reflect the new position even when paused
            setCurrentAngles(prev => {
                const newAngles = [...prev];
                // Ensure array is large enough if we just added segments and paused (edge case)
                if (newAngles.length <= index) {
                    // Fill gaps if necessary, though usually animate loop fills it. 
                    // But if paused immediately after adding, prev might be short.
                    // safely extending:
                    for (let k = newAngles.length; k <= index; k++) newAngles[k] = 0;
                }
                newAngles[index] = angleRad;
                return newAngles;
            });
        }
    };

    const handleVelocityChange = (index, velocity) => {
        if (physicsRef.current && physicsRef.current.segments[index]) {
            physicsRef.current.segments[index].velocity = velocity;
        }
    };

    // Panel Drag Logic
    const [panelPos, setPanelPos] = useState({ x: window.innerWidth - 380, y: 20 });
    const [isDraggingPanel, setIsDraggingPanel] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handlePanelMouseDown = (e) => {
        // Only allow dragging from header/empty space, not inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;

        setIsDraggingPanel(true);
        dragOffset.current = {
            x: e.clientX - panelPos.x,
            y: e.clientY - panelPos.y
        };
    };

    const handlePanelMouseMove = (e) => {
        if (!isDraggingPanel) return;
        setPanelPos({
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y
        });
    };

    const handlePanelMouseUp = () => {
        setIsDraggingPanel(false);
    };

    // Panel Visibility
    const [showControls, setShowControls] = useState(true);
    const [selectedSegment, setSelectedSegment] = useState(null);

    const handleConfigChange = (newConfig) => {
        console.log("App: Config Update Requested", newConfig);
        setConfig(newConfig);
    };

    const handlePreset = (newConfig) => {
        setConfig(newConfig);
        // Force reset physics to match new preset immediately
        physicsRef.current = new PendulumState(newConfig.pendulums);
        physicsRef.current.g = newConfig.gravity;
        physicsRef.current.damping = newConfig.damping;

        setTrail([]);
        setCoords(physicsRef.current.getCoordinates());
        setCurrentAngles(physicsRef.current.segments.map(s => s.angle));
        setCurrentVelocities(physicsRef.current.segments.map(s => s.velocity));

        // If paused, ensure we see the new state
        if (paused) {
            // force render
        }
    };

    return (
        <div
            className="pendulum-page h-screen w-screen bg-black text-white overflow-hidden relative"
            onMouseMove={handlePanelMouseMove}
            onMouseUp={handlePanelMouseUp}
            onMouseLeave={handlePanelMouseUp}
        >
            {/* Full Screen Canvas */}
            <div className="absolute top-0 left-0 w-full h-full z-10">
                <PendulumCanvas
                    stateCoords={coords}
                    config={config}
                    trail={trail}
                    onAngleChange={handleAngleChange}
                    onSelectSegment={(index) => {
                        setSelectedSegment(index);
                        setShowControls(true); // Auto-open controls if hidden
                    }}
                />
            </div>

            {/* Title / Header (Minimal) */}
            <div className="absolute top-5 left-5 z-20 pointer-events-none">
                <h1 className="m-0 text-2xl text-white/80 shadow-black drop-shadow-md font-heading">N-Pendulum</h1>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setShowControls(!showControls)}
                className="absolute top-5 right-5 z-20 bg-white/10 border border-white/20 text-white rounded-full w-10 h-10 cursor-pointer flex items-center justify-center backdrop-blur-sm hover:bg-white/20 transition-colors"
                title="Toggle Configuration"
            >
                {showControls ? '✕' : '⚙️'}
            </button>

            {/* Draggable Controls */}
            {showControls && (
                <div
                    style={{
                        top: panelPos.y,
                        left: panelPos.x,
                    }}
                    className={`absolute w-[350px] max-h-[90vh] bg-[#141414]/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col z-30 ${isDraggingPanel ? 'cursor-grabbing' : 'auto'}`}
                >
                    {/* Drag Handle */}
                    <div
                        onMouseDown={handlePanelMouseDown}
                        className="px-5 py-3 bg-white/5 border-b border-white/5 cursor-grab select-none flex justify-between items-center"
                    >
                        <span className="font-semibold text-sm opacity-90">Configuration</span>
                        <div className="w-10 h-1 bg-white/10 rounded-full" />
                    </div>

                    <div className="p-0 overflow-y-auto flex-1 scrollbar-hide">
                        <PendulumControls
                            config={config}
                            currentAngles={currentAngles}
                            currentVelocities={currentVelocities}
                            onConfigChange={handleConfigChange}
                            onPreset={handlePreset}
                            onReset={handleReset}
                            onPause={() => setPaused(!paused)}
                            paused={paused}
                            onAngleChange={handleAngleChange}
                            onVelocityChange={handleVelocityChange}
                            selectedSegment={selectedSegment}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pendulum;
