// src/Page/Sudoku/WinningModal.js
import React from "react";
import { motion } from "framer-motion";

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return "--:--";
  return new Date(seconds * 1000).toISOString().substr(14, 5);
}

export default function WinningModal({ onClose, onNewGame, timeElapsed, stats, hasUsedSolver, theme, themeColors }) {
  const isNewRecord = !hasUsedSolver && stats && stats.bestTime === timeElapsed;
  const isDark = theme === 'dark';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[10000] backdrop-blur-md"
      style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative p-8 rounded-3xl shadow-2xl text-center min-w-[340px] border-4 border-transparent`}
        style={{ 
             backgroundColor: themeColors.bg, 
             color: themeColors.text,
             boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.2)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-6xl mb-4 block"
        >
            🎉
        </motion.div>
        
        <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`}>You Win!</h2>

        {hasUsedSolver ? (
          <p className="text-red-500 font-bold mb-6">
            Solver used - Stats not recorded.
          </p>
        ) : (
          <div className={`mb-6 text-left inline-block p-4 rounded-xl w-full ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
             <div className="flex justify-between mb-2">
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Time:</span>
                <span className="font-bold text-xl flex items-center">
                    {formatTime(timeElapsed)} 
                    {isNewRecord && <span className="ml-2 animate-bounce" title="New Record!">🏆</span>}
                </span>
             </div>
             <div className="flex justify-between mb-2">
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Best Time:</span>
                <span className="font-semibold">{stats ? formatTime(stats.bestTime) : "--:--"}</span>
             </div>
             <div className="flex justify-between">
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Games Won:</span>
                <span className="font-semibold">{stats ? stats.won : 0}</span>
             </div>
          </div>
        )}

        <div className="flex gap-4 justify-center mt-2">
          <button
             onClick={onClose}
             className={`px-6 py-3 rounded-2xl font-bold transition-transform active:scale-95 ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            Close
          </button>
          <button
            onClick={onNewGame}
            className={`px-8 py-3 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-95 hover:scale-105 ${isDark ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'}`}
          >
            New Game
          </button>
        </div>
      </motion.div>
    </div>
  );
}
