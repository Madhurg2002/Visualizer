import React from 'react';

const PendulumControls = ({
    config,
    onConfigChange,
    onReset,
    onPause,
    paused,
    onAngleChange,
    currentAngles,
    selectedSegment
}) => {
    const handleSliderChange = (index, key, value) => {
        const val = parseFloat(value);
        const newPendulums = [...config.pendulums];
        newPendulums[index] = { ...newPendulums[index], [key]: val };
        onConfigChange({ ...config, pendulums: newPendulums });
    };

    const handleAngleChange = (index, degrees) => {
        const rad = (degrees * Math.PI) / 180;
        // Update local config for UI
        const newPendulums = [...config.pendulums];
        newPendulums[index] = { ...newPendulums[index], angle: rad };
        onConfigChange({ ...config, pendulums: newPendulums });

        // Notify parent to update physics immediately
        if (onAngleChange) {
            onAngleChange(index, rad);
        }
    };

    const handleGlobalChange = (key, value) => {
        onConfigChange({ ...config, [key]: parseFloat(value) });
    };

    const handleCountChange = (value) => {
        const count = parseInt(value, 10);
        if (count < 1 || count > 10) return;

        const newPendulums = [...config.pendulums];
        if (count > newPendulums.length) {
            // Add new segments
            for (let i = newPendulums.length; i < count; i++) {
                newPendulums.push({ mass: 5, length: 100, angle: Math.PI / 2 });
            }
        } else {
            // Remove segments
            newPendulums.length = count;
        }
        onConfigChange({ ...config, pendulums: newPendulums });
    };

    const applyPreset = (type) => {
        let newConfig = { ...config };
        switch (type) {
            case 'chaos':
                newConfig.pendulums = [
                    { mass: 10, length: 150, angle: Math.PI / 2 },
                    { mass: 10, length: 150, angle: Math.PI / 2 + 0.5 }
                ];
                break;
            case 'cradle':
                newConfig.pendulums = Array(5).fill(0).map((_, i) => ({
                    mass: 5, length: 150, angle: i === 0 ? Math.PI / 1.5 : Math.PI / 2
                }));
                // Actually Newton's cradle is different physics (collision), this acts more like a string
                // Let's call it "Snake"
                break;
            case 'snake':
                newConfig.pendulums = Array(8).fill(0).map((_, i) => ({
                    mass: 2, length: 50, angle: Math.PI / 2 + (i * 0.2)
                }));
                break;
            case 'inverted':
                newConfig.pendulums = [
                    { mass: 10, length: 150, angle: -Math.PI / 2 }, // Upwards
                    { mass: 10, length: 150, angle: -Math.PI / 2 }
                ];
                break;
            default:
                break;
        }
        onConfigChange(newConfig);
    };

    // Helper for nicer labels
    const Label = ({ children }) => (
        <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '4px' }}>
            {children}
        </label>
    );

    const ControlRow = ({ children }) => (
        <div style={{ marginBottom: '12px' }}>
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
        <div className="pendulum-controls" style={{
            padding: '24px',
            background: 'transparent',
            color: 'white',
            height: '100%',
            overflowY: 'auto',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Presets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                <button
                    onClick={() => applyPreset('chaos')}
                    style={{ padding: '8px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                    Double Chaos
                </button>
                <button
                    onClick={() => applyPreset('snake')}
                    style={{ padding: '8px', background: '#8b5cf6', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                    Long Snake
                </button>
                <button
                    onClick={() => applyPreset('inverted')}
                    style={{ padding: '8px', background: '#10b981', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                    Inverted
                </button>
                <button
                    onClick={onReset}
                    style={{ padding: '8px', background: '#ef4444', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                    Reset All
                </button>
            </div>

            <h3 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px', fontSize: '1rem', color: '#eee' }}>
                Global Settings
            </h3>

            <div style={{ background: '#222', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <ControlRow>
                    <Label>Pendulums: {config.pendulums.length}</Label>
                    <input
                        type="range" min="1" max="10"
                        style={{ width: '100%', accentColor: '#3b82f6' }}
                        value={config.pendulums.length}
                        onChange={(e) => handleCountChange(e.target.value)}
                    />
                </ControlRow>

                <ControlRow>
                    <Label>Gravity: {config.gravity}</Label>
                    <input
                        type="range" min="0" max="3" step="0.1"
                        style={{ width: '100%', accentColor: '#3b82f6' }}
                        value={config.gravity}
                        onChange={(e) => handleGlobalChange('gravity', e.target.value)}
                    />
                </ControlRow>

                <ControlRow>
                    <Label>Air Resistance: {config.damping}</Label>
                    <input
                        type="range" min="0" max="0.1" step="0.001"
                        style={{ width: '100%', accentColor: '#3b82f6' }}
                        value={config.damping}
                        onChange={(e) => handleGlobalChange('damping', e.target.value)}
                    />
                </ControlRow>

                <ControlRow>
                    <Label>Trail Length: {config.trailLength}</Label>
                    <input
                        type="range" min="0" max="1000" step="50"
                        style={{ width: '100%', accentColor: '#3b82f6' }}
                        value={config.trailLength}
                        onChange={(e) => handleGlobalChange('trailLength', e.target.value)}
                    />
                </ControlRow>

                <button
                    onClick={onPause}
                    style={{
                        width: '100%',
                        padding: '10px',
                        cursor: 'pointer',
                        background: paused ? '#22c55e' : '#eab308',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'black',
                        fontWeight: 'bold',
                        marginTop: '10px'
                    }}
                >
                    {paused ? "Resume" : "Pause"}
                </button>
            </div>

            <h4 style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
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

                return (
                    <div
                        key={i}
                        ref={el => segmentRefs.current[i] = el}
                        style={{
                            marginTop: '10px',
                            padding: '12px',
                            background: i === selectedSegment ? '#333' : '#252525',
                            borderRadius: '8px',
                            borderLeft: `4px solid hsl(${(i * 60) % 360}, 70%, 60%)`,
                            border: i === selectedSegment ? '1px solid rgba(255,255,255,0.3)' : 'none',
                            transition: 'background 0.3s'
                        }}
                    >
                        <strong style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Segment {i + 1}</strong>

                        <ControlRow>
                            <Label>Length: {p.length}px</Label>
                            <input
                                type="range" min="10" max="300"
                                style={{ width: '100%', accentColor: '#777' }}
                                value={p.length}
                                onChange={(e) => handleSliderChange(i, 'length', e.target.value)}
                            />
                        </ControlRow>

                        <ControlRow>
                            <Label>Mass: {p.mass}</Label>
                            <input
                                type="range" min="1" max="100"
                                style={{ width: '100%', accentColor: '#777' }}
                                value={p.mass}
                                onChange={(e) => handleSliderChange(i, 'mass', e.target.value)}
                            />
                        </ControlRow>

                        <ControlRow>
                            <Label>Angle: {angleDeg}°</Label>
                            <input
                                type="range" min="-180" max="180"
                                style={{ width: '100%', accentColor: '#777' }}
                                value={angleDeg}
                                onChange={(e) => handleAngleChange(i, e.target.value)}
                            />
                        </ControlRow>
                    </div>
                );
            })}
        </div>
    );
};

export default PendulumControls;
