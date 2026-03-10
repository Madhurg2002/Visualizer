// src/Page/Sudoku/Controls.js
import React from "react";
import { Undo2, CheckCircle2, Lightbulb, RefreshCw, Settings2 } from "lucide-react";
import { PencilIcon } from "./Icons";

export default function Controls({
  difficulty,
  setDifficulty,
  onDifficultyChange,
  seedInput,
  setSeedInput,
  currentSeed,
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
  onApplySeed,
  isNoteMode,
  onToggleNoteMode,
  theme,
  themeColors,
}) {
  const baseButtonStyle = {
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "none",
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    userSelect: "none",
    boxShadow: theme === "dark" ? "0 4px 6px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.1)",
    outline: "none",
    transition: "all 0.2s ease",
  };

  const labelColor = theme === "dark" ? "#cbd5e1" : "#475569";
  const inputBg = theme === "dark" ? "#1e293b" : "#fff";
  const inputBorder = theme === "dark" ? "#475569" : "#cbd5e1";
  const inputColor = theme === "dark" ? "#f8fafc" : "#0f172a";
  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C15]";

  return (
    <div className="w-full max-w-2xl px-4 flex flex-col items-center gap-4 mb-4">
      
      {/* Configuration Row: Seed & Difficulty */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-800/20 p-3 rounded-2xl backdrop-blur-sm border border-white/5">
        <label
          style={{ fontWeight: "600", color: labelColor, display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}
          title="Puzzle Seed (changes the generated board)"
        >
          Seed:
          <div className={`flex bg-slate-900/50 rounded-lg p-1 border border-white/10 focus-within:border-blue-500/50 transition-colors`}>
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onApplySeed()}
              placeholder="Enter seed"
              className={focusRing}
              title="Enter a custom puzzle seed"
              style={{
                fontFamily: "monospace",
                padding: "4px 8px",
                width: 100,
                background: "transparent",
                color: inputColor,
                border: "none",
                fontSize: 14
              }}
            />
            {seedInput !== currentSeed && (
              <button
                onClick={onApplySeed}
                className={`bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors ${focusRing}`}
                title="Load puzzle from this seed"
              >
                GO
              </button>
            )}
          </div>
        </label>
        
        <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleButtonClick("new", onRandomize)}
            style={{
              ...baseButtonStyle,
              backgroundColor: poppedButton === "new" ? "#1e40af" : (theme === "dark" ? "#334155" : "#e2e8f0"),
              color: theme === "dark" ? "#f8fafc" : "#0f172a",
              transform: poppedButton === "new" ? "scale(0.95)" : "scale(1)",
              flex: 1
            }}
            title="Generate a random puzzle"
            className={focusRing}
          >
            <RefreshCw size={16} className={poppedButton === "new" ? "animate-spin-fast" : ""} />
            Random
          </button>
          
          <button
            onClick={() => {
              if (typeof onDifficultyChange === "function") {
                onDifficultyChange();
              } else {
                const levels = ["easy", "medium", "hard", "extreme"];
                const nextIndex = (levels.indexOf(difficulty) + 1) % levels.length;
                setDifficulty(levels[nextIndex]);
              }
            }}
            style={{
              ...baseButtonStyle,
              backgroundColor: "transparent",
              color: difficulty === "extreme" ? "#ef4444" : difficulty === "hard" ? "#f59e0b" : difficulty === "medium" ? "#3b82f6" : "#22c55e",
              border: `1px solid ${difficulty === "extreme" ? "#ef444450" : difficulty === "hard" ? "#f59e0b50" : difficulty === "medium" ? "#3b82f650" : "#22c55e50"}`,
              minWidth: 100,
              flex: 1
            }}
            className={`hover:bg-white/5 ${focusRing}`}
            title="Cycle through difficulty levels"
          >
            <Settings2 size={16} />
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </button>
        </div>
      </div>

      {/* Action Row: Undo, Notes, Hint */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
        <button
          onClick={() => handleButtonClick("undo", onUndo)}
          disabled={undoDisabled}
          style={{
            ...baseButtonStyle,
            backgroundColor: theme === "dark" ? "#1e293b" : "#f1f5f9",
            color: theme === "dark" ? "#cbd5e1" : "#475569",
            opacity: undoDisabled ? 0.4 : 1,
            cursor: undoDisabled ? "default" : "pointer",
            transform: poppedButton === "undo" ? "scale(0.95)" : "scale(1)",
            border: theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1",
          }}
          className={`${!undoDisabled ? "hover:bg-slate-700/50 hover:border-slate-500/50" : ""} ${focusRing}`}
          title="Undo your last move"
        >
          <Undo2 size={18} />
        </button>

        <button
          onClick={() => {
              if (onToggleNoteMode) onToggleNoteMode();
          }}
          style={{
            ...baseButtonStyle,
            backgroundColor: isNoteMode ? "#4f46e5" : (theme === "dark" ? "#1e293b" : "#f1f5f9"),
            color: isNoteMode ? "#ffffff" : (theme === "dark" ? "#cbd5e1" : "#475569"),
            transform: isNoteMode ? "scale(1.05)" : "scale(1)",
            border: isNoteMode ? "1px solid #6366f1" : (theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1"),
            boxShadow: isNoteMode ? "0 0 15px rgba(79,70,229,0.3)" : "none"
          }}
          className={`${!isNoteMode ? "hover:bg-slate-700/50 hover:border-slate-500/50" : ""} ${focusRing}`}
          title="Toggle Notes mode (Keyboard shortcut: N)"
        >
          <PencilIcon size={18} />
        </button>

        <button
          onClick={() => handleButtonClick("check", onCheck)}
          disabled={checkDisabled}
          style={{
            ...baseButtonStyle,
            backgroundColor: theme === "dark" ? "#14532d" : "#dcfce7",
            color: theme === "dark" ? "#86efac" : "#166534",
            opacity: checkDisabled ? 0.4 : 1,
            cursor: checkDisabled ? "default" : "pointer",
            transform: poppedButton === "check" ? "scale(0.95)" : "scale(1)",
            border: theme === "dark" ? "1px solid #166534" : "1px solid #86efac",
          }}
          className={`${!checkDisabled ? "hover:bg-green-900/80 hover:border-green-500/50" : ""} ${focusRing}`}
          title="Check the board for mistakes"
        >
          <CheckCircle2 size={18} />
        </button>

        <button
          onClick={() => handleButtonClick("hint", onHint)}
          style={{
            ...baseButtonStyle,
            backgroundColor: theme === "dark" ? "#78350f" : "#fef3c7",
            color: theme === "dark" ? "#fcd34d" : "#b45309",
            transform: poppedButton === "hint" ? "scale(0.95)" : "scale(1)",
            border: theme === "dark" ? "1px solid #92400e" : "1px solid #fcd34d",
          }}
          className={`hover:bg-amber-900/80 hover:border-amber-500/50 ${focusRing}`}
          title="Show a hint for a logical next step"
        >
          <Lightbulb size={18} />
        </button>
      </div>
    </div>
  );
}
