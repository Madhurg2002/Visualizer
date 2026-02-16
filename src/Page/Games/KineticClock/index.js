
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DigitGrid from './DigitGrid';

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
        <div className="min-h-screen bg-[#0B0C15] flex flex-col items-center justify-center relative overflow-hidden text-slate-200 font-sans select-none">

            {/* Back Button */}
            <div className="absolute top-8 left-8 z-10">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md rounded-full shadow-lg border border-white/10 text-slate-300 hover:text-white transition-all font-bold group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back</span>
                </button>
            </div>

            <div className="text-center mb-16 relative z-10">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 mb-6 drop-shadow-sm">
                    KINETIC CLOCK
                </h1>
                <p className="text-slate-500 font-medium tracking-widest uppercase text-sm">
                    {time.toLocaleTimeString()}
                </p>
            </div>

            {/* The Clock Grid */}
            <div className="p-12 bg-slate-900/50 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/10 relative z-10">
                {/* Glow effect behind */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-[3rem] pointer-events-none" />
                
                <div className="flex gap-8 md:gap-16 items-center relative">
                    {/* Hours */}
                    <div className="flex gap-6">
                        <DigitGrid char={hStr[0]} label="Hours" />
                        <DigitGrid char={hStr[1]} />
                    </div>

                    {/* Gap (Colon) */}
                    <div className="flex flex-col gap-8 opacity-20">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>

                    {/* Minutes */}
                    <div className="flex gap-6">
                        <DigitGrid char={mStr[0]} label="Minutes" />
                        <DigitGrid char={mStr[1]} />
                    </div>

                    {/* Gap (Colon) */}
                    <div className="flex flex-col gap-8 opacity-20">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>

                    {/* Seconds */}
                    <div className="flex gap-6">
                        <DigitGrid char={sStr[0]} label="Seconds" />
                        <DigitGrid char={sStr[1]} />
                    </div>
                </div>
            </div>

            <div className="mt-16 text-slate-500 text-xs font-medium tracking-widest uppercase opacity-60">
                Inspired by ClockClock 24
            </div>

        </div>
    );
};

export default KineticClock;
