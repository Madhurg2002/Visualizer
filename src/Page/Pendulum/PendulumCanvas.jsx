import React, { useRef, useEffect, useState } from 'react';

const PendulumCanvas = ({ stateCoords, config, trail, onAngleChange, onSelectSegment }) => {
    const canvasRef = useRef(null);
    const [draggingIndex, setDraggingIndex] = useState(null);

    // Re-calculate scaling factors to share between draw and mouse events
    const getTransform = (width, height, config) => {
        const startX = width / 2;
        const startY = height / 3;

        const totalLength = config.pendulums.reduce((acc, p) => acc + p.length, 0);
        const maxReach = totalLength * 1.2;
        const availableHeight = height - startY;

        // Ensure scale is never 0 or negative
        let scale = 1;
        if (totalLength > availableHeight - 50 && totalLength > 0) {
            scale = (availableHeight - 50) / totalLength;
        }

        return { startX, startY, scale };
    };

    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Drawing Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { width, height } = dimensions;

        // Update canvas size
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        const { startX, startY, scale } = getTransform(width, height, config);

        // Save context to restore later
        ctx.save();
        ctx.translate(startX, startY);
        ctx.scale(scale, scale);
        ctx.translate(-startX, -startY); // Move origin back, so drawing happens in scaled world space relative to (startX, startY)
        // Wait, standard approach:
        // Translate to origin (startX, startY). Scale. Draw relative to (0,0).
        // My previous code was: translate(startX, startY), scale, translate(-startX, -startY).
        // This scales everything *around* the pivot point (startX, startY).

        // Let's stick to the previous verified logic:
        // origin is at startX, startY in screen space.
        // We want to scale distances.


        const drawStartX = startX;
        const drawStartY = startY;

        // Draw Trail (in world space, but we need to inverse-transform or just draw using same transform)
        if (config.trailLength > 0 && trail.length > 1) {
            ctx.beginPath();
            ctx.lineWidth = 2 / scale; // Adjust line width so it stays constant visually
            if (ctx.lineWidth < 1) ctx.lineWidth = 1;

            ctx.strokeStyle = `rgba(0, 255, 255, 0.5)`;

            for (let i = 0; i < trail.length - 1; i++) {
                const alpha = (i / trail.length) * 0.5;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                // Trail coordinates are relative to pivot (0,0) in physics space??
                // No, getCoordinates returns x,y relative to pivot (0,0).
                // So if we translate to (startX, startY), we can just draw at x,y.

                // Correction: The transform translate(startX, startY) -> scale -> translate(-startX, -startY)
                // effectively scales the distance from (startX, startY).
                // So drawing at (startX + x, startY + y) works. 

                ctx.moveTo(drawStartX + trail[i].x, drawStartY + trail[i].y);
                ctx.lineTo(drawStartX + trail[i + 1].x, drawStartY + trail[i + 1].y);
                ctx.stroke();
            }
        }

        let currentX = drawStartX;
        let currentY = drawStartY;

        ctx.lineWidth = 4 / scale;
        if (ctx.lineWidth < 1) ctx.lineWidth = 1;
        ctx.strokeStyle = '#fff';
        ctx.lineCap = 'round';

        stateCoords.forEach((coord, index) => {
            if (!config.pendulums[index]) return;

            const nextX = drawStartX + coord.x;
            const nextY = drawStartY + coord.y;
            const mass = config.pendulums[index].mass;

            // Draw Connection (Rod, Spring, or String)
            ctx.beginPath();

            if (config.mode === 'spring') {
                // Draw Zig-Zag Spring
                const dx = nextX - currentX;
                const dy = nextY - currentY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                const coils = 10;
                const width = 6 / scale; // Visual width of spring coil

                ctx.save();
                ctx.translate(currentX, currentY);
                ctx.rotate(angle);

                ctx.moveTo(0, 0);
                for (let i = 1; i <= coils; i++) {
                    const x = (dist / coils) * i;
                    const y = (i % 2 === 0 ? 1 : -1) * width;
                    // Ease in/out at ends
                    if (i === coils) ctx.lineTo(dist, 0);
                    else ctx.lineTo(x, y);
                }

                ctx.restore();
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
            } else if (config.mode === 'string') {
                // Draw String (thinner, maybe slack visual if we had data, but straight for now)
                ctx.moveTo(currentX, currentY);
                ctx.lineTo(nextX, nextY);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.setLineDash([5, 5]); // Dashed for string? Or just thin. 
                // Let's stick to solid but thin and white.
                ctx.setLineDash([]);
                ctx.lineWidth = 2 / scale;
            } else {
                // Rod (Rigid)
                ctx.moveTo(currentX, currentY);
                ctx.lineTo(nextX, nextY);
                ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            }

            ctx.stroke();
            ctx.setLineDash([]); // Reset

            // Bob
            ctx.beginPath();
            // Scale radius inversely so it doesn't get tiny
            const visualRadius = Math.max(5, Math.sqrt(mass) * 3) / scale;

            ctx.arc(nextX, nextY, visualRadius, 0, 2 * Math.PI);
            ctx.fillStyle = `hsl(${(index * 60) % 360}, 70%, 60%)`;
            ctx.fill();

            // Highlight if dragging
            if (index === draggingIndex) {
                ctx.lineWidth = 2 / scale;
                ctx.strokeStyle = 'yellow';
                ctx.stroke();
            } else {
                ctx.strokeStyle = 'white';
                ctx.stroke();
            }

            currentX = nextX;
            currentY = nextY;
        });

        // Pivot
        ctx.beginPath();
        ctx.arc(drawStartX, drawStartY, 5 / scale, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.restore();
    }, [stateCoords, config, trail, draggingIndex, dimensions]);


    // Interaction Handlers
    const handleMouseDown = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Correct for CSS scaling // With fullscreen canvas, scale should be ~1 but good to keep
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const { startX, startY, scale } = getTransform(canvas.width, canvas.height, config);

        // Find clicked bob
        // We know the screen coordinates of bobs are transform(startX + coord.x, startY + coord.y)
        // Transform logic: 
        // X_screen = startX + (X_world - 0) * scale  <-- Assuming simplified scaling logic centered at pivot
        // Let's verify transform: translate(startX, startY) scale(s) translate(-startX, -startY)
        // P_screen = T * S * T^-1 * P_input
        // P_input = (startX + x, startY + y)
        // result = startX + (startX + x - startX)*s = startX + x*s
        // Yes. So ScreenX = startX + x * scale.

        let foundIndex = -1;

        for (let i = 0; i < stateCoords.length; i++) {
            if (!config.pendulums[i]) continue;

            const bobScreenX = startX + stateCoords[i].x * scale;
            const bobScreenY = startY + stateCoords[i].y * scale;

            const dist = Math.sqrt((mouseX - bobScreenX) ** 2 + (mouseY - bobScreenY) ** 2);

            // Hit radius ~ 20px (adjusted for scale? no, screen pixels)
            if (dist < 20) {
                foundIndex = i;
                if (onSelectSegment) onSelectSegment(i);
                break; // Grab the first one (top to bottom? usually bottom is on top visually)
            }
        }

        // Search in reverse to grab the "topmost" rendered bob (which is the last one in array)
        for (let i = stateCoords.length - 1; i >= 0; i--) {
            if (!config.pendulums[i]) continue;
            const bobScreenX = startX + stateCoords[i].x * scale;
            const bobScreenY = startY + stateCoords[i].y * scale;
            const dist = Math.sqrt((mouseX - bobScreenX) ** 2 + (mouseY - bobScreenY) ** 2);
            if (dist < 20) {
                setDraggingIndex(i);
                if (onSelectSegment) onSelectSegment(i);
                return;
            }
        }
    };

    const handleMouseMove = (e) => {
        if (draggingIndex === null) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const { startX, startY, scale } = getTransform(canvas.width, canvas.height, config);

        // Calculate Vector from Parent Pivot to Mouse
        // Parent Pivot Position:
        // if draggingIndex == 0, parent is (startX, startY)
        // else parent is stateCoords[draggingIndex - 1]

        let parentScreenX = startX;
        let parentScreenY = startY;

        if (draggingIndex > 0) {
            const parentCoord = stateCoords[draggingIndex - 1];
            parentScreenX = startX + parentCoord.x * scale;
            parentScreenY = startY + parentCoord.y * scale;
        }

        const dx = mouseX - parentScreenX;
        const dy = mouseY - parentScreenY; // Y positive is down

        // Angle defined as 0 = down? In Physics: 
        // x += L * sin(theta)
        // y += L * cos(theta)
        // So theta=0 is down (positive Y). theta=PI/2 is right (positive X).

        // Math.atan2(y, x) gives angle from X axis.
        // We want angle from Y axis (down).
        // Standard atan2(dy, dx) gives angle relative to "Right".
        // angle_physics = atan2(dx, dy) matches sin=x, cos=y.

        const newAngle = Math.atan2(dx, dy);

        if (onAngleChange) {
            onAngleChange(draggingIndex, newAngle);
        }
    };

    const handleMouseUp = () => {
        setDraggingIndex(null);
    };


    return (
        <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                display: 'block',
                background: '#111',
                cursor: draggingIndex !== null ? 'grabbing' : 'grab'
            }}
        />
    );
};

export default PendulumCanvas;
