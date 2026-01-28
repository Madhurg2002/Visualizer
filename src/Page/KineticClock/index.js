
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Clock from './Clock';
import { DIGITS } from './digits';

// Pattern Extraction Helper
const getPattern = (char) => DIGITS[parseInt(char)] || DIGITS[0];

// Memoize DigitGrid to prevent re-renders if digit doesn't change
const DigitGrid = React.memo(({ char, label }) => {
    const pattern = getPattern(char);
    return (
        <div className="flex flex-col gap-2 items-center">
            {/* 3 Rows */}
            {Array.from({ length: 3 }).map((_, row) => (
                <div key={row} className="flex gap-2">
                    {/* 2 Cols */}
                    {[0, 1].map(col => {
                        const idx = row * 2 + col;
                        const angles = pattern[idx];
                        return <Clock key={col} h={angles.h} m={angles.m} size={50} />;
                    })}
                </div>
            ))}
            {label && <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">{label}</div>}
        </div>
    );
});

const KineticClock = () => {
    const navigate = useNavigate();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        // Sync to minute edge for cleaner effect?
        // Or just update every second and digits change when they change.
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    // Digits: H1 H2 : M1 M2
    // If h < 10, H1=0.
    const hStr = hours.toString().padStart(2, '0');
    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0'); // Maybe for colon effect?

    // Colon separator (2 clocks vertical?)
    // Standard kinetic clock has 8x3. 4 digits x 2 cols = 8 cols. 
    // They are usually flush.
    // Let's add gap between digits.

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden text-slate-900">

            {/* Back Button */}
            <div className="absolute top-8 left-8 z-10">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white backdrop-blur-md rounded-full shadow-sm text-slate-600 hover:text-slate-900 transition-all font-bold"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>
            </div>

            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-800 mb-4">
                    KINETIC CLOCK
                </h1>
                <p className="text-slate-500 font-medium tracking-wide">
                    {time.toLocaleTimeString()}
                </p>
            </div>

            {/* The Clock Grid */}
            <div className="p-8 bg-white/50 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/40">
                <div className="flex gap-8 md:gap-12 items-center">
                    {/* Hours */}
                    <div className="flex gap-4">
                        <DigitGrid char={hStr[0]} label="Hours" />
                        <DigitGrid char={hStr[1]} />
                    </div>

                    {/* Gap */}
                    <div className="w-4"></div>

                    {/* Minutes */}
                    <div className="flex gap-4">
                        <DigitGrid char={mStr[0]} label="Minutes" />
                        <DigitGrid char={mStr[1]} />
                    </div>

                    {/* Gap */}
                    <div className="w-4"></div>

                    {/* Seconds */}
                    <div className="flex gap-4">
                        <DigitGrid char={sStr[0]} label="Seconds" />
                        <DigitGrid char={sStr[1]} />
                    </div>
                </div>
            </div>

            <div className="mt-12 text-slate-400 text-sm font-medium">
                Inspired by ClockClock 24
            </div>

        </div>
    );
};

export default KineticClock;
