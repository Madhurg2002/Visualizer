// src/Page/Sudoku/Settings.js
import React from "react";

export default function Settings({
  visible, onClose,
  continuousCheck, setContinuousCheck,
  theme, setTheme,
  highlightNumbers, setHighlightNumbers,
  highlightGuides, setHighlightGuides,
  autoRemoveNotes, setAutoRemoveNotes,
  showNotes, setShowNotes,
  onAutoFillNotes,
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
          background: theme === "dark" ? "#1e293b" : "#fff",
          color: theme === "dark" ? "#f1f5f9" : "#0f172a",
          padding: 32, borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)", minWidth: 320,
          position: "relative",
          border: theme === "dark" ? "1px solid #334155" : "none",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontWeight: "700", marginBottom: 20 }}>Settings</h3>

        <button
          onClick={() => setContinuousCheck(!continuousCheck)}
          style={{
            width: "100%", textAlign: "left", marginBottom: 16,
            padding: "12px 16px", borderRadius: 12,
            backgroundColor: continuousCheck 
              ? (theme === "dark" ? "#064e3b" : "#dcfce7") 
              : (theme === "dark" ? "#1e293b" : "#f1f5f9"),
            color: continuousCheck 
              ? (theme === "dark" ? "#6ee7b7" : "#166534") 
              : (theme === "dark" ? "#94a3b8" : "#475569"),
            border: continuousCheck 
              ? (theme === "dark" ? "1px solid #059669" : "2px solid #22c55e") 
              : (theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1"),
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
            backgroundColor: highlightNumbers 
              ? (theme === "dark" ? "#1e3a8a" : "#dbeafe") 
              : (theme === "dark" ? "#1e293b" : "#f1f5f9"),
            color: highlightNumbers 
              ? (theme === "dark" ? "#93c5fd" : "#1e40af") 
              : (theme === "dark" ? "#94a3b8" : "#475569"),
            border: highlightNumbers 
              ? (theme === "dark" ? "1px solid #2563eb" : "2px solid #3b82f6") 
              : (theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1"),
            fontWeight: 600, cursor: "pointer", fontSize: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span>Highlight Numbers</span>
          <span>{highlightNumbers ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={() => setHighlightGuides(!highlightGuides)}
          style={{
            width: "100%", textAlign: "left", marginBottom: 16,
            padding: "12px 16px", borderRadius: 12,
            backgroundColor: highlightGuides 
              ? (theme === "dark" ? "#1e3a8a" : "#dbeafe") 
              : (theme === "dark" ? "#1e293b" : "#f1f5f9"),
            color: highlightGuides 
              ? (theme === "dark" ? "#93c5fd" : "#1e40af") 
              : (theme === "dark" ? "#94a3b8" : "#475569"),
            border: highlightGuides 
              ? (theme === "dark" ? "1px solid #2563eb" : "2px solid #3b82f6") 
              : (theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1"),
            fontWeight: 600, cursor: "pointer", fontSize: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span>Highlight Guides</span>
          <span>{highlightGuides ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={() => setAutoRemoveNotes(!autoRemoveNotes)}
          style={{
            width: "100%", textAlign: "left", marginBottom: 16,
            padding: "12px 16px", borderRadius: 12,
            backgroundColor: autoRemoveNotes 
              ? (theme === "dark" ? "#1e3a8a" : "#dbeafe") 
              : (theme === "dark" ? "#1e293b" : "#f1f5f9"),
            color: autoRemoveNotes 
              ? (theme === "dark" ? "#93c5fd" : "#1e40af") 
              : (theme === "dark" ? "#94a3b8" : "#475569"),
            border: autoRemoveNotes 
              ? (theme === "dark" ? "1px solid #2563eb" : "2px solid #3b82f6") 
              : (theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1"),
            fontWeight: 600, cursor: "pointer", fontSize: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span>Auto-Remove Notes</span>
          <span>{autoRemoveNotes ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={() => setShowNotes(!showNotes)}
          style={{
            width: "100%", textAlign: "left", marginBottom: 16,
            padding: "12px 16px", borderRadius: 12,
            backgroundColor: showNotes 
              ? (theme === "dark" ? "#1e3a8a" : "#dbeafe") 
              : (theme === "dark" ? "#1e293b" : "#f1f5f9"),
            color: showNotes 
              ? (theme === "dark" ? "#93c5fd" : "#1e40af") 
              : (theme === "dark" ? "#94a3b8" : "#475569"),
            border: showNotes 
              ? (theme === "dark" ? "1px solid #2563eb" : "2px solid #3b82f6") 
              : (theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1"),
            fontWeight: 600, cursor: "pointer", fontSize: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span>Show Notes on Board</span>
          <span>{showNotes ? "ON" : "OFF"}</span>
        </button>

        <div style={{ marginBottom: 24 }}>
          <button
            onClick={onAutoFillNotes}
            style={{
              width: "100%", textAlign: "left",
              padding: "12px 16px", borderRadius: 12,
              backgroundColor: theme === "dark" ? "#1e293b" : "#f1f5f9",
              color: theme === "dark" ? "#e2e8f0" : "#334155",
              border: theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1",
              fontWeight: 600, cursor: "pointer", fontSize: 16,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              transition: "opacity 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
            onMouseLeave={e => e.currentTarget.style.opacity = 1}
          >
            <span>Auto-Fill All Notes</span>
            <span style={{ fontSize: 18 }}>✏️</span>
          </button>
        </div>

        <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          style={{
            width: "100%", textAlign: "left", marginBottom: 24,
            padding: "12px 16px", borderRadius: 12,
            backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
            color: theme === "dark" ? "#f1f5f9" : "#334155",
            border: theme === "dark" ? "1px solid #475569" : "1px solid #94a3b8",
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
