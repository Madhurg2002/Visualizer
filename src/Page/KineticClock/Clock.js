
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const Hand = ({ angle, length, width, color = "black" }) => {
    // We maintain a cumulative rotation to ensure clockwise movement
    const [visualAngle, setVisualAngle] = useState(angle);
    const prevAngle = useRef(angle);
    const revolutions = useRef(0);

    useEffect(() => {
        let current = angle;
        let prev = prevAngle.current;

        // Normalize strict 0-360 input just in case
        current = current % 360;
        if (current < 0) current += 360;

        prev = prev % 360;
        if (prev < 0) prev += 360;

        // Calculate shortest path? OR always clockwise?
        // Kinetic clocks usually strictly clockwise or shortest path.
        // Let's do Shortest Path for efficiency, OR Clockwise for style.
        // User image: simple black lines.
        // Let's try Shortest Path.
        let delta = current - prev;

        // If delta is huge (e.g. 10 -> 350 = -340), corresponds to -20 deg wrap.
        // Shortest: if |delta| > 180, wrap.
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        // Update visual angle
        // We add delta to the *rendered* value (state)
        // Actually, simpler: keep adding delta to a persistent ref tracker?
        // setVisualAngle(prevVisual => prevVisual + delta);
        // But we need to sync with the 'angle' prop exactly.

        // Let's use the 'Always Clockwise' logic for Kinetic feel?
        // If target is 90, current is 270. Clockwise: 270 -> 90+360=450. (180 rotation)
        // If target is 270, current is 90. Clockwise: 90 -> 270. (180 rotation)
        // If target is 10, current is 350. CW: 350 -> 370.

        // Always forward logic:
        let next = angle;
        // Ensure next > visualAngle (logic is complex with state).

        // Simpler approach: Just animate to `angle`.
        // If `angle` changes from 270 to 0, pass 360.
        // Parent should probably simplify coordinates.
        // Let's implement shortest path here.

    }, [angle]);

    return (
        <motion.div
            className="absolute top-1/2 left-1/2 origin-bottom bg-black rounded-full"
            initial={{ rotate: angle }}
            animate={{ rotate: angle }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            style={{
                width: width,
                height: length,
                x: "-50%",
                y: "-100%" // Pivot at bottom
            }}
        />
    )
}

// Improved Logic:
// The parent sends "Target Angle".
// We want to animate to Target.
// If Target < Current, add 360? 
// Actually, let's just use `animate={{ rotate: angle }}` provided the parent passes monotonic values?
// No, parent passes 0, 90, 180.
// We wrap component to handle logic?
// Let's try a simple approach first: 
// 0 -> 90 (CW 90).
// 270 -> 0 (CW 90).
// 0 -> 270 (CCW 90).
// Is Shortest Path okay? Yes.
// Does Framer Motion do shortest path? No, it interpolates number.
// 270->0 goes 270->200->100->0 (CCW 270deg spin).
// We want 270->360.
// So we must transform '0' to '360' if prev was 270.

const AnimatedHand = ({ targetAngle, length, width }) => {
    const currentAngle = useRef(targetAngle);

    // Check if wrapping needed
    // logic: delta
    let delta = targetAngle - (currentAngle.current % 360);
    // Standardize delta to -180..180
    if (delta > 180) delta -= 360;
    if (delta <= -180) delta += 360;

    // Update cumulative
    currentAngle.current += delta;

    return (
        <motion.div
            className="absolute top-1/2 left-1/2 origin-bottom bg-slate-900 rounded-full shadow-sm"
            animate={{ rotate: currentAngle.current }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }} // Slower, heavier feel
            style={{
                width: width,
                height: length,
                x: "-50%",
                y: "-90%" // Pivot slightly inside
            }}
        />
    );
};

const Clock = ({ h, m, size = 100 }) => {
    return (
        <div
            className="relative bg-slate-200 rounded-full shadow-inner border border-slate-300"
            style={{ width: size, height: size }}
        >
            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-slate-800 rounded-full dark:bg-black z-20 -translate-x-1/2 -translate-y-1/2 shadow-md"></div>

            {/* Hands */}
            <AnimatedHand targetAngle={h} length={size * 0.45} width={size * 0.12} />
            <AnimatedHand targetAngle={m} length={size * 0.45} width={size * 0.12} />
        </div>
    );
};

export default React.memo(Clock);
