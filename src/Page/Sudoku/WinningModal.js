// src/Page/Sudoku/WinningModal.js
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return "--:--";
  return new Date(seconds * 1000).toISOString().substr(14, 5);
}

export default function WinningModal({ onClose, onNewGame, timeElapsed, stats, hasUsedSolver }) {
  const isNewRecord = !hasUsedSolver && stats && stats.bestTime === timeElapsed;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          background: "#fff",
          padding: 36,
          borderRadius: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          textAlign: "center",
          minWidth: 340,
          border: '4px solid #fff'
        }}
        onClick={e => e.stopPropagation()}
      >
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
            style={{ fontSize: "4rem", marginBottom: 10, display: 'block' }}
        >
            🎉
        </motion.div>
        
        <h2 style={{ fontSize: "2.2rem", marginBottom: 8, color: "#166534", margin: '0 0 16px 0' }}>You Win!</h2>

        {hasUsedSolver ? (
          <p style={{ color: "#ef4444", fontWeight: "bold", marginBottom: 20 }}>
            Solver used - Stats not recorded.
          </p>
        ) : (
          <div style={{ marginBottom: 24, textAlign: 'left', display: 'inline-block', background: '#f8fafc', padding: 16, borderRadius: 12, width: '100%' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Time:</span>
                <span style={{ fontWeight: 700, fontSize: '1.2rem'}}>{formatTime(timeElapsed)} 
                    {isNewRecord && <span style={{ marginLeft: 8 }} title="New Record!">🏆</span>}
                </span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Best Time:</span>
                <span style={{ fontWeight: 600 }}>{stats ? formatTime(stats.bestTime) : "--:--"}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Games Won:</span>
                <span style={{ fontWeight: 600 }}>{stats ? stats.won : 0}</span>
             </div>
          </div>
        )}

        <div style={{ marginTop: 0, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
             onClick={onClose}
             style={{
               padding: "12px 24px",
               fontSize: 16,
               fontWeight: "600",
               borderRadius: 14,
               color: "#475569",
               backgroundColor: "#f1f5f9",
               border: "none",
               cursor: "pointer",
             }}
          >
            Close
          </button>
          <button
            onClick={onNewGame}
            style={{
              padding: "12px 48px",
              fontSize: 18,
              fontWeight: "700",
              borderRadius: 14,
              color: "#fff",
              backgroundColor: "#2563eb",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px #2563eb66",
              transition: "transform 0.1s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            New Game
          </button>
        </div>
      </motion.div>
    </div>
  );
}
