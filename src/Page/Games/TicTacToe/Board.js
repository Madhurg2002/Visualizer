
import React from 'react';
import { motion } from 'framer-motion';

const Cell = ({ value, onClick, isWinning, disabled, isDisappearing }) => {
    return (
        <motion.div
            whileHover={!value && !disabled ? { scale: 0.95, backgroundColor: "rgba(255,255,255,0.05)" } : {}}
            whileTap={!value && !disabled ? { scale: 0.9 } : {}}
            className={`
        w-24 h-24 md:w-32 md:h-32 flex items-center justify-center 
        rounded-xl cursor-pointer text-5xl md:text-6xl font-black relative overflow-hidden
        ${!value ? 'bg-slate-800/30 hover:bg-slate-800/50' : 'bg-slate-800/40'}
        ${isWinning ? 'shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]' : ''}
        ${isDisappearing ? 'opacity-40 animate-pulse border-red-500/50 shadow-[inset_0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/5 shadow-inner'}
        border backdrop-blur-sm
        transition-all duration-300
      `}
            onClick={!disabled ? onClick : undefined}
        >
            {value === 'X' && (
                <motion.div
                    initial={{ scale: 0, rotate: -45, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <svg width="60" height="60" viewBox="0 0 100 100" className={`drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] ${isDisappearing && 'text-red-400 opacity-60'}`}>
                        <line x1="20" y1="20" x2="80" y2="80" stroke={isDisappearing ? "#f87171" : "#60a5fa"} strokeWidth="12" strokeLinecap="round" />
                        <line x1="80" y1="20" x2="20" y2="80" stroke={isDisappearing ? "#f87171" : "#60a5fa"} strokeWidth="12" strokeLinecap="round" />
                    </svg>
                </motion.div>
            )}
            {value === 'O' && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <svg width="60" height="60" viewBox="0 0 100 100" className={`drop-shadow-[0_0_8px_rgba(192,132,252,0.8)] ${isDisappearing && 'text-red-400 opacity-60'}`}>
                        <circle cx="50" cy="50" r="35" stroke={isDisappearing ? "#f87171" : "#c084fc"} strokeWidth="12" fill="none" strokeLinecap="round" />
                    </svg>
                </motion.div>
            )}
        </motion.div>
    );
};

const Board = ({ squares, onClick, winningLine, disabled, disappearingIndex }) => {
    // Calculate SVG Line coordinates if there is a winner
    const renderWinningLine = () => {
        if (!winningLine) return null;
        const [a, b, c] = winningLine;
        
        // Map index to x,y percentages (approximately)
        // 0 1 2 -> 16.6% 50% 83.3%
        const getCoord = (idx) => {
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            return { x: col * 33.33 + 16.66, y: row * 33.33 + 16.66 };
        };

        const start = getCoord(a);
        const end = getCoord(c);

        return (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                <motion.line
                    x1={`${start.x}%`}
                    y1={`${start.y}%`}
                    x2={`${end.x}%`}
                    y2={`${end.y}%`}
                    stroke="#facc15" // Yellow/Amber
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                />
            </svg>
        );
    };

    return (
        <div className="relative p-3 bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-3 gap-2 md:gap-3">
                {squares.map((square, i) => (
                    <Cell
                        key={i}
                        value={square}
                        onClick={() => onClick(i)}
                        isWinning={winningLine && winningLine.includes(i)}
                        disabled={disabled || (winningLine && !winningLine.includes(i))}
                        isDisappearing={i === disappearingIndex}
                    />
                ))}
            </div>
            {renderWinningLine()}
        </div>
    );
};

export default Board;
