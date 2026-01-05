// src/Page/Sudoku/Settings.js
import React from "react";

export default function Settings({
  visible, onClose,
  continuousCheck, setContinuousCheck,
  theme, setTheme,
  highlightNumbers, setHighlightNumbers,
}) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", padding: 32, borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)", minWidth: 320,
          position: "relative",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontWeight: "700", marginBottom: 20 }}>Settings</h3>

        <button
          onClick={() => setContinuousCheck(!continuousCheck)}
          style={{
            width: "100%", textAlign: "left", marginBottom: 16,
            padding: "12px 16px", borderRadius: 12,
            backgroundColor: continuousCheck ? "#dcfce7" : "#f1f5f9",
            color: continuousCheck ? "#166534" : "#475569",
            border: continuousCheck ? "2px solid #22c55e" : "1px solid #cbd5e1",
            fontWeight: 600, cursor: "pointer", fontSize: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span>Mistake Check</span>
          <span>{continuousCheck ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={() => setHighlightNumbers(!highlightNumbers)}
          style={{
            width: "100%", textAlign: "left", marginBottom: 16,
            padding: "12px 16px", borderRadius: 12,
            backgroundColor: highlightNumbers ? "#dbeafe" : "#f1f5f9",
            color: highlightNumbers ? "#1e40af" : "#475569",
            border: highlightNumbers ? "2px solid #3b82f6" : "1px solid #cbd5e1",
            fontWeight: 600, cursor: "pointer", fontSize: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span>Highlight Numbers</span>
          <span>{highlightNumbers ? "ON" : "OFF"}</span>
        </button>

        <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          style={{
            width: "100%", textAlign: "left", marginBottom: 24,
            padding: "12px 16px", borderRadius: 12,
            backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
            color: theme === "dark" ? "#f1f5f9" : "#334155",
            border: theme === "dark" ? "2px solid #64748b" : "1px solid #94a3b8",
            fontWeight: 600, cursor: "pointer", fontSize: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span>Theme</span>
          <span style={{ textTransform: "capitalize" }}>{theme}</span>
        </button>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 12,
            backgroundColor: "#0f172a",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >Close</button>
      </div>
    </div>
  );
}
