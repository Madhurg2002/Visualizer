import React from 'react';

import { RotateCcw, Play, Pause, Settings, Plus, Minus, Info } from 'lucide-react';

const PendulumControls = ({
    config,
    onConfigChange,
    onReset,
    onPause,
    paused,
    onAngleChange,
    currentAngles,
    currentVelocities,
    selectedSegment,
    onVelocityChange,
    onPreset
}) => {
    // ... (handlers remain same)

    const handleSliderChange = (index, key, value) => {
        const val = parseFloat(value);
        const newPendulums = [...config.pendulums];
        newPendulums[index] = { ...newPendulums[index], [key]: val };
        onConfigChange({ ...config, pendulums: newPendulums });

        if (key === 'velocity' && onVelocityChange) {
            onVelocityChange(index, val);
        }
    };

    const handleAngleChange = (index, degrees) => {
        const rad = (degrees * Math.PI) / 180;
        const newPendulums = [...config.pendulums];
        newPendulums[index] = { ...newPendulums[index], angle: rad };
        onConfigChange({ ...config, pendulums: newPendulums });

        if (onAngleChange) {
            onAngleChange(index, rad);
        }
    };

    const handleGlobalChange = (key, value) => {
        const val = key === 'mode' ? value : parseFloat(value);
        onConfigChange({ ...config, [key]: val });
    };

    const handleCountChange = (value) => {
        let count = parseInt(value, 10);
        if (isNaN(count)) return;
        if (count < 1) count = 1;
        if (count > 20) count = 20; // Increased max limit slightly for fun

        if (count === config.pendulums.length) return;

        const newPendulums = [...config.pendulums];
        if (count > newPendulums.length) {
            for (let i = newPendulums.length; i < count; i++) {
                newPendulums.push({ mass: 5, length: 100, angle: Math.PI / 2, velocity: 0 });
            }
        } else {
            newPendulums.length = count;
        }
        onConfigChange({ ...config, pendulums: newPendulums });
    };

    const applyPreset = (type) => {
        let newConfig = { ...config };
        switch (type) {
            case 'chaos':
                newConfig.pendulums = [
                    { mass: 10, length: 150, angle: Math.PI / 2, velocity: 0 },
                    { mass: 10, length: 150, angle: Math.PI / 2 + 0.5, velocity: 0 }
                ];
                break;
            case 'snake':
                newConfig.pendulums = Array(8).fill(0).map((_, i) => ({
                    mass: 2, length: 50, angle: Math.PI / 2 + (i * 0.2), velocity: 0
                }));
                break;
            case 'inverted':
                newConfig.pendulums = [
                    { mass: 10, length: 150, angle: Math.PI * 0.99, velocity: 0 },
                    { mass: 10, length: 150, angle: Math.PI * 0.99, velocity: 0 }
                ];
                break;
            default: break;
        }
        if (onPreset) {
            onPreset(newConfig);
        } else {
            onConfigChange(newConfig);
        }
    };

    const Label = ({ children }) => (
        <label className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
            {children}
        </label>
    );

    const ControlRow = ({ children }) => (
        <div className="mb-4">
            {children}
        </div>
    );

    const segmentRefs = React.useRef([]);

    React.useEffect(() => {
        if (selectedSegment !== null && segmentRefs.current[selectedSegment]) {
            segmentRefs.current[selectedSegment].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selectedSegment]);

    return (
        <div className="p-6 text-white h-full overflow-y-auto font-sans scrollbar-hide">
            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                <button title="Double Chaos" onClick={() => applyPreset('chaos')} className="control-btn p-3 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition-colors">
                    Chaos
                </button>
                <button title="Long Snake" onClick={() => applyPreset('snake')} className="control-btn p-3 bg-violet-500 rounded-lg text-white hover:bg-violet-600 transition-colors">
                    Snake
                </button>
                <button title="Inverted" onClick={() => applyPreset('inverted')} className="control-btn p-3 bg-emerald-500 rounded-lg text-white hover:bg-emerald-600 transition-colors">
                    Invert
                </button>
            </div>

            <div className="flex gap-2 mb-8">
                <button
                    onClick={onReset}
                    className="control-btn flex-1 p-3 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                    <RotateCcw size={16} /> Reset
                </button>
                <button
                    onClick={onPause}
                    className={`control-btn flex-1 p-3 rounded-lg text-black font-bold transition-colors flex items-center justify-center gap-2 ${paused ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                >
                    {paused ? <Play size={16} /> : <Pause size={16} />}
                    <span>{paused ? "Resume" : "Pause"}</span>
                </button>
            </div>

            <h3 className="mt-0 mb-5 flex items-center gap-2 text-base font-semibold text-gray-200">
                <Settings size={18} className="text-gray-400" /> Global Settings
            </h3>

            <div className="bg-white/5 p-4 rounded-lg mb-5 border border-white/5">
                <ControlRow>
                    <Label><span>Pendulums</span> <span className="text-white">{config.pendulums.length}</span></Label>
                    <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCountChange(config.pendulums.length - 1);
                            }}
                            className="control-btn flex-1 p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors flex items-center justify-center"
                        >
                            <Minus size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCountChange(config.pendulums.length + 1);
                            }}
                            className="control-btn flex-1 p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors flex items-center justify-center"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </ControlRow>

                <ControlRow>
                    <Label><span>Gravity</span> <span>{config.gravity}</span></Label>
                    <input
                        type="range" min="0" max="3" step="0.1"
                        value={config.gravity}
                        onChange={(e) => handleGlobalChange('gravity', e.target.value)}
                        className="w-full"
                    />
                </ControlRow>

                <ControlRow>
                    <Label><span>Air Resistance</span> <span>{config.damping}</span></Label>
                    <input
                        type="range" min="0" max="0.1" step="0.001"
                        value={config.damping}
                        onChange={(e) => handleGlobalChange('damping', e.target.value)}
                        className="w-full"
                    />
                </ControlRow>

                <ControlRow>
                    <Label><span>Trail Length</span> <span>{config.trailLength}</span></Label>
                    <input
                        type="range" min="0" max="1000" step="50"
                        value={config.trailLength}
                        onChange={(e) => handleGlobalChange('trailLength', e.target.value)}
                        className="w-full"
                    />
                </ControlRow>
            </div>

            <h4 className="text-gray-500 uppercase text-xs tracking-widest mb-4 font-semibold">
                Segments configuration
            </h4>

            {config.pendulums.map((p, i) => {
                // Use live physics angle if available, otherwise config angle
                let rawAngle = (currentAngles && currentAngles[i] !== undefined) ? currentAngles[i] : (p.angle || 0);

                // Normalize to -180 to 180 for the slider
                // Physics angle is in radians and can be > 2PI
                let normalizedAngle = rawAngle % (2 * Math.PI);
                if (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
                if (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

                const angleDeg = Math.round(normalizedAngle * 180 / Math.PI);

                const isSelected = i === selectedSegment;

                return (
                    <div
                        key={i}
                        ref={el => segmentRefs.current[i] = el}
                        className={`mt-3 p-3 rounded-lg border-l-4 transition-all duration-300 ${isSelected ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                        style={{
                            borderLeftColor: `hsl(${(i * 60) % 360}, 70%, 60%)`
                        }}
                    >
                        <strong className="block mb-3 text-sm text-white/90 font-medium">
                            Segment {i + 1}
                        </strong>

                        <ControlRow>

                        <ControlRow>
                            <Label><span>Length</span> <span>{p.length}px</span></Label>
                            <input
                                type="range" min="10" max="300"
                                value={p.length}
                                onChange={(e) => handleSliderChange(i, 'length', e.target.value)}
                                className="w-full"
                            />
                        </ControlRow>

                        <ControlRow>
                            <Label><span>Mass</span> <span>{p.mass}</span></Label>
                            <input
                                type="range" min="1" max="100"
                                value={p.mass}
                                onChange={(e) => handleSliderChange(i, 'mass', e.target.value)}
                                className="w-full"
                            />
                        </ControlRow>


                            <Label><span>Angle</span> <span>{angleDeg}°</span></Label>
                            <input
                                type="range" min="-180" max="180"
                                value={angleDeg}
                                onChange={(e) => handleAngleChange(i, e.target.value)}
                                className="w-full"
                            />
                        </ControlRow>

                        <ControlRow>
                            <Label><span>Velocity</span> <span>{(currentVelocities && currentVelocities[i] !== undefined ? currentVelocities[i] : (p.velocity || 0)).toFixed(2)}</span></Label>
                            <input
                                type="range" min="-20" max="20" step="0.1"
                                value={currentVelocities && currentVelocities[i] !== undefined ? currentVelocities[i] : (p.velocity || 0)}
                                onChange={(e) => handleSliderChange(i, 'velocity', e.target.value)}
                                className="w-full"
                            />
                        </ControlRow>
                    </div>
                );
            })}
        </div>
    );
};

export default PendulumControls;
