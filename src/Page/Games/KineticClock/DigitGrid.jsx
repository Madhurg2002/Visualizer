import React from 'react';
import Clock from './Clock';
import { DIGITS } from './digits';

// Pattern Extraction Helper
const getPattern = (char) => DIGITS[parseInt(char)] || DIGITS[0];

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

export default DigitGrid;
