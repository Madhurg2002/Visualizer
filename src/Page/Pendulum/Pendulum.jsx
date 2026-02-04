import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PendulumState } from './PendulumPhysics';
import PendulumCanvas from './PendulumCanvas';
import PendulumControls from './PendulumControls';

const Pendulum = () => {
    // Initial Configuration
    const [config, setConfig] = useState({
        gravity: 1,
        damping: 0.005,
        trailLength: 200,
        pendulums: [
            { mass: 10, length: 150, angle: Math.PI / 2 },
            { mass: 10, length: 150, angle: Math.PI / 2 }
        ]
    });

    const [paused, setPaused] = useState(false);
    const [coords, setCoords] = useState([]);
    const [currentAngles, setCurrentAngles] = useState([]);
    const [fps, setFps] = useState(0);
    const [trail, setTrail] = useState([]);

    // Physics State Ref (mutable for performance loop)
    const physicsRef = useRef(new PendulumState(2, [10, 10], [150, 150]));
    const requestRef = useRef();
    const lastTimeRef = useRef();
    const frameCountRef = useRef(0);
    const lastFpsTimeRef = useRef(0);

    // Sync physics engine with React config config when it changes significantly
    // (e.g., number of pendulums or hard reset)
    useEffect(() => {
        handleReset();
    }, [config.pendulums.length]); // Only reset fully if N changes

    // Update params on the fly without resetting position
    useEffect(() => {
        // Update physics parameters
        const p = physicsRef.current;
        p.g = config.gravity;
        p.damping = config.damping;
        p.lengths = config.pendulums.map(c => c.length);
        p.masses = config.pendulums.map(c => c.mass);

        // Only update angles if they have changed significantly from physics state (to avoid loop)
        // Or if we assume config is the source of truth when changed via UI
        // For simplicity, we'll sync angles effectively "teleporting" the pendulum
        // but only if the user explicitly changed the config which causes this effect.
        // To avoid jitter during animation, we can check if we are paused OR if the config change came from the slider

        // Actually, let's only sync angles if the simulation is paused OR we assume the user is "grabbing" it.
        // A simple way is to detecting if the angle in config is different from the current physics angle by a threshold
        // But since config doesn't update from physics (only other way), this is safe.
        // However, we don't want to reset angles if we just changed gravity.
        // Ideally we need to know *which* property changed.

        // Let's rely on the fact that we will update `config.pendulums` with the current physics angles 
        // ONLY when we want to save state? No, that's complex.

        // Better approach: access the updated angle directly in the handleSliderChange logic?
        // No, we are in a declarative React world.

        // Let's iterate and see if the config angle differs significantly from the previous config?
        // Easier: Just update them. If the simulation is running, the physics engine will overwrite them next frame anyway. 
        // BUT if we overwrite them here, we might reset the motion.

        // Correct Logic:
        // We only want to set physics angles if the user *dragged the angle slider*.
        // If the user changed gravity, we shouldn't reset angles.
        // We can check this by comparing `p.angles` to `config.pendulums[i].angle`.
        // If they are wildly different, maybe user intervention?
        // But physics changes angles every frame.

        // Simplification for this task:
        // We will update angles in `PendulumControls` using a callback that directly modifies physicsRef 
        // OR we specifically handle angle changes separately.

        // Let's try passing a specific `updateAngle` function to Controls.
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
        setCurrentAngles(Array.from(physicsRef.current.angles));

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
        const lengths = config.pendulums.map(p => p.length);
        const masses = config.pendulums.map(p => p.mass);

        // Randomize initial angles slightly for interest
        const angles = config.pendulums.map(() => Math.PI / 2 + (Math.random() - 0.5));

        physicsRef.current = new PendulumState(
            config.pendulums.length,
            masses,
            lengths,
            angles
        );
        physicsRef.current.g = config.gravity;
        physicsRef.current.damping = config.damping;

        setTrail([]);
        setCoords(physicsRef.current.getCoordinates());
    };

    const handleAngleChange = (index, angleRad) => {
        // Direct physics update for smooth interaction
        if (physicsRef.current) {
            physicsRef.current.angles[index] = angleRad;
            physicsRef.current.velocities[index] = 0; // consistent 'grab' feel

            // Also force update coords immediately so visual feedback is instant
            setCoords(physicsRef.current.getCoordinates());
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

    return (
        <div
            className="pendulum-page"
            onMouseMove={handlePanelMouseMove}
            onMouseUp={handlePanelMouseUp}
            onMouseLeave={handlePanelMouseUp}
            style={{
                height: '100vh',
                width: '100vw',
                background: '#000',
                color: 'white',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Full Screen Canvas */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
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
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 5, pointerEvents: 'none' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)', color: 'rgba(255,255,255,0.8)' }}>N-Pendulum</h1>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setShowControls(!showControls)}
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    zIndex: 20,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(5px)'
                }}
            >
                {showControls ? '✕' : '⚙️'}
            </button>

            {/* Draggable Controls */}
            {showControls && (
                <div
                    style={{
                        position: 'absolute',
                        top: panelPos.y,
                        left: panelPos.x,
                        width: '350px',
                        maxHeight: '90vh',
                        background: 'rgba(20, 20, 20, 0.9)',
                        backdropFilter: 'blur(15px)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: isDraggingPanel ? 'grabbing' : 'auto',
                        zIndex: 10
                    }}
                >
                    {/* Drag Handle */}
                    <div
                        onMouseDown={handlePanelMouseDown}
                        style={{
                            padding: '12px 20px',
                            background: 'rgba(255,255,255,0.03)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            cursor: 'grab',
                            userSelect: 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', opacity: 0.9 }}>Configuration</span>
                        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
                    </div>

                    <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                        <PendulumControls
                            config={config}
                            currentAngles={currentAngles}
                            onConfigChange={setConfig}
                            onReset={handleReset}
                            onPause={() => setPaused(!paused)}
                            paused={paused}
                            onAngleChange={handleAngleChange}
                            selectedSegment={selectedSegment}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pendulum;
