
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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
            className="absolute top-1/2 left-1/2 origin-bottom bg-slate-900 rounded-full shadow-sm dark:bg-black"
            animate={{ rotate: currentAngle.current }}
            transition={{ type: "spring", stiffness: 80, damping: 20, mass: 1.2 }} // Tuned for mechanical feel
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
