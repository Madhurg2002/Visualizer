// src/Page/Sudoku/WinningModal.js
import React from "react";

export default function WinningModal({ onClose }) {
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
        <p style={{ fontSize: "1.2rem", marginBottom: 20 }}>You completed the puzzle successfully!</p>
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
  );
}
