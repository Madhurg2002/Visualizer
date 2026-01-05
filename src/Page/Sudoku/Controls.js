// src/Page/Sudoku/Controls.js
import React from "react";

export default function Controls({
  difficulty,
  setDifficulty,
  seedInput,
  setSeedInput,
  onRandomize,
  onUndo,
  undoDisabled,
  onCheck,
  checkDisabled,
  onHint,
  onVisualizeSolver,
  solving,
  poppedButton,
  handleButtonClick,
}) {
  const baseButtonStyle = {
    padding: "10px 20px",
    margin: "0 8px 8px 0",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 16,
    cursor: "pointer",
    userSelect: "none",
    boxShadow: "0 3px 13px #0002",
    outline: "none",
    transition: "transform 0.15s ease-in-out",
  };

  return (
    <div
      style={{
        maxWidth: 450,
        marginBottom: 12,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <label
        style={{ fontWeight: "600", color: "#475569", display: "flex", alignItems: "center", gap: 6 }}
      >
        Seed:
        <input
          type="text"
          value={seedInput}
          onChange={(e) => setSeedInput(e.target.value)}
          placeholder="Enter seed"
          style={{
            fontFamily: "monospace",
            padding: 4,
            width: 160,
            borderRadius: 6,
            border: "1px solid #a5b4fc",
            outline: "none",
          }}
        />
      </label>
      <button
        onClick={() => handleButtonClick("new", onRandomize)}
        style={{
          ...baseButtonStyle,
          backgroundColor: poppedButton === "new" ? "#1d4ed8" : "#2563eb",
          color: "white",
          transform: poppedButton === "new" ? "scale(1.1)" : "scale(1)",
        }}
      >
        Randomize
      </button>
      <button
        onClick={() => {
          const levels = ["easy", "medium", "hard"];
          const nextIndex = (levels.indexOf(difficulty) + 1) % levels.length;
          setDifficulty(levels[nextIndex]);
        }}
        style={{
          ...baseButtonStyle,
          backgroundColor: "#2563eb",
          color: "white",
          minWidth: 140,
        }}
      >
        Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </button>
      <button
        onClick={() => handleButtonClick("undo", onUndo)}
        disabled={undoDisabled}
        style={{
          ...baseButtonStyle,
          backgroundColor: poppedButton === "undo" ? "#831843" : "#9d174d",
          color: "white",
          opacity: undoDisabled ? 0.5 : 1,
          cursor: undoDisabled ? "default" : "pointer",
          transform: poppedButton === "undo" ? "scale(1.1)" : "scale(1)",
        }}
      >
        Undo
      </button>
      <button
        onClick={() => handleButtonClick("check", onCheck)}
        disabled={checkDisabled}
        style={{
          ...baseButtonStyle,
          backgroundColor: poppedButton === "check" ? "#166534" : "#22c55e",
          color: "white",
          opacity: checkDisabled ? 0.5 : 1,
          cursor: checkDisabled ? "default" : "pointer",
          transform: poppedButton === "check" ? "scale(1.1)" : "scale(1)",
        }}
      >
        Check
      </button>
      <button
        onClick={() => handleButtonClick("hint", onHint)}
        style={{
          ...baseButtonStyle,
          backgroundColor: poppedButton === "hint" ? "#78350f" : "#f59e0b",
          color: "white",
          transform: poppedButton === "hint" ? "scale(1.1)" : "scale(1)",
        }}
      >
        Show Hint
      </button>

    </div>
  );
}
