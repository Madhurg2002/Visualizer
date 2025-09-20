// src/Page/Sudoku/Settings.js
import React from "react";

export default function Settings({ visible, onClose, continuousCheck, setContinuousCheck, theme, setTheme }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
          maxWidth: 400,
          width: "90%",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16 }}>Settings</h3>

        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span>Continuous Mistake Check</span>
          <input
            type="checkbox"
            checked={continuousCheck}
            onChange={(e) => setContinuousCheck(e.target.checked)}
          />
        </label>

        <div>
          <label htmlFor="theme-select">Color Theme:</label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{ marginLeft: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 16 }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 24,
            padding: "10px 20px",
            fontSize: 16,
            borderRadius: 10,
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            float: "right",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
