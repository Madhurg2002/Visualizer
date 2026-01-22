
import React from 'react';
import { motion } from 'framer-motion';

const Cell = ({ value, onClick, isWinning }) => {
    return (
        <motion.div
            whileHover={!value ? { scale: 0.95, backgroundColor: "rgba(255,255,255,0.1)" } : {}}
            whileTap={!value ? { scale: 0.9 } : {}}
            className={`
        w-24 h-24 md:w-32 md:h-32 flex items-center justify-center 
        border-2 border-white/10 rounded-2xl cursor-pointer text-5xl md:text-6xl font-black 
        ${isWinning ? 'bg-green-500/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-slate-800/50'}
        transition-colors
      `}
            onClick={onClick}
        >
            {value === 'X' && (
                <motion.span
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-300 drop-shadow-lg"
                >
                    X
                </motion.span>
            )}
            {value === 'O' && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-300 drop-shadow-lg"
                >
                    O
                </motion.span>
            )}
        </motion.div>
    );
};

const Board = ({ squares, onClick, winningLine }) => {
    return (
        <div className="grid grid-cols-3 gap-3 md:gap-4 p-4 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
            {squares.map((square, i) => (
                <Cell
                    key={i}
                    value={square}
                    onClick={() => onClick(i)}
                    isWinning={winningLine && winningLine.includes(i)}
                />
            ))}
        </div>
    );
};

export default Board;
