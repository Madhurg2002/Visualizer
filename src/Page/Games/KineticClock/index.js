
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../../Components/PageHeader';
import DigitGrid from './DigitGrid';

const KineticClock = () => {
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
        <div className="min-h-screen bg-[#0B0C15] flex flex-col items-center justify-center relative overflow-hidden text-slate-200 font-sans select-none pt-2 pb-4">

            {/* Back Button */}
            <div className="absolute top-4 left-4 right-4 md:left-8 md:right-8 z-10">
                <PageHeader title="Kinetic Clock" accent="from-white to-slate-500" />
            </div>

            <div className="text-center mb-10 relative z-10 mt-12">
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
