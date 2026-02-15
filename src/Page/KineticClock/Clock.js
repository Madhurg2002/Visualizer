
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const AnimatedHand = ({ targetAngle, length, width, color = "bg-slate-200" }) => {
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
            className={`absolute top-1/2 left-1/2 origin-bottom rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${color}`}
            animate={{ rotate: currentAngle.current }}
            transition={{ type: "spring", stiffness: 60, damping: 15, mass: 1 }} // Smoother motion
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
            className="relative bg-[#1a1c2e] rounded-full shadow-[inset_0_2px_5px_rgba(0,0,0,0.5),0_5px_15px_rgba(0,0,0,0.3)] border border-white/5"
            style={{ width: size, height: size }}
        >
            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-900 rounded-full z-20 -translate-x-1/2 -translate-y-1/2 shadow-md border border-white/10"></div>

            {/* Hands */}
            {/* Hour Hand - Cyan Neon */}
            <AnimatedHand targetAngle={h} length={size * 0.40} width={size * 0.12} color="bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            
            {/* Minute Hand - Purple Neon */}
            <AnimatedHand targetAngle={m} length={size * 0.40} width={size * 0.12} color="bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
        </div>
    );
};

export default React.memo(Clock);
