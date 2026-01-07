// src/Page/Sudoku/WinningModal.js
import React from "react";

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return "--:--";
  return new Date(seconds * 1000).toISOString().substr(14, 5);
}

export default function WinningModal({ onClose, timeElapsed, stats, hasUsedSolver }) {
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
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 20,
          boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
          textAlign: "center",
          minWidth: 320,
        }}
      >
        <h2 style={{ fontSize: "2rem", marginBottom: 15, color: "#22c55e" }}>🎉 You Win!</h2>

        {hasUsedSolver ? (
          <p style={{ color: "#ef4444", fontWeight: "bold", marginBottom: 20 }}>
            Solver used - Stats not recorded.
          </p>
        ) : (
          <div style={{ marginBottom: 20, textAlign: 'left', display: 'inline-block' }}>
            <p style={{ fontSize: "1.1rem", margin: "5px 0" }}>
              <strong>Time:</strong> {formatTime(timeElapsed)}
              {isNewRecord && <span style={{ color: "#eab308", marginLeft: 8 }}>🏆 New Best!</span>}
            </p>
            <p style={{ fontSize: "1.1rem", margin: "5px 0" }}>
              <strong>Best Time:</strong> {stats ? formatTime(stats.bestTime) : "--:--"}
            </p>
            <p style={{ fontSize: "1.1rem", margin: "5px 0" }}>
              <strong>Games Won:</strong> {stats ? stats.won : 0}
            </p>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 36px",
              fontSize: 18,
              fontWeight: "700",
              borderRadius: 12,
              color: "#fff",
              backgroundColor: "#2563eb",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px #2563ebaa",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
