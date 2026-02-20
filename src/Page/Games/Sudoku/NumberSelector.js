import React from "react";
import { Eraser } from "lucide-react";

export default function NumberSelector({ selected, setSelected, onErase, themeColors, board, solution }) {
  // Calculate counts of correctly placed numbers
  const numberCounts = Array(10).fill(0);
  if (board && solution) {
      for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
              const val = board[r][c];
              if (val !== 0 && val === solution[r][c]) {
                  numberCounts[val]++;
              }
          }
      }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        marginTop: 24,
        padding: "0 8px",
        userSelect: "none",
        display: "flex",
        justifyContent: "space-between", // Distribute space
        flexWrap: "nowrap", // Force single line
        gap: "2%", // Use relative gap
        // overflowX: "auto", 
      }}
    >
      {[...Array(9)].map((_, i) => {
        const n = i + 1;
        const isSelected = selected === n;
        const isCompleted = numberCounts[n] >= 9;
        
        return (
          <button
            key={n}
            onClick={() => {
                if (!isCompleted) setSelected(isSelected ? null : n);
            }}
            style={{
              flex: "1", // Grow and shrink
              maxWidth: 44, // Max desktop size
              aspectRatio: "1 / 1",
              borderRadius: "15%", // Responsive radius
              padding: 0,
              border: isSelected
                ? `3px solid ${themeColors.numberBtnSelBg}`
                : "2px solid #b0bec5",
              backgroundColor: isSelected
                ? themeColors.numberBtnSelBg
                : themeColors.numberBtnBg,
              color: isSelected
                ? themeColors.numberBtnSelColor
                : themeColors.numberBtnColor,
              fontWeight: 700,
              fontSize: "clamp(16px, 5vw, 24px)", // Responsive font size
              cursor: isCompleted ? "default" : "pointer",
              boxShadow: isSelected
                ? `0 0 12px ${themeColors.numberBtnSelBg}`
                : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              opacity: isCompleted ? 0.3 : 1,
            }}
            disabled={isCompleted}
            aria-pressed={isSelected}
            aria-label={`Select number ${n}`}
            onMouseDown={(e) => {
              if (!isCompleted) e.currentTarget.style.transform = "scale(0.95)"
            }}
            onMouseUp={(e) => {
              if (!isCompleted) e.currentTarget.style.transform = ""
            }}
            onMouseLeave={(e) => {
              if (!isCompleted) e.currentTarget.style.transform = ""
            }}
          >
            {n}
          </button>
        );
      })}
      <button
        onClick={onErase}
        style={{
          flex: "1",
          maxWidth: 44,
          aspectRatio: "1 / 1",
          borderRadius: "15%",
          padding: 0,
          border: "2px solid #b0bec5",
          backgroundColor: themeColors.bg === '#0f172a' ? '#334155' : '#e2e8f0',
          color: themeColors.bg === '#0f172a' ? '#f87171' : '#ef4444',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        aria-label="Erase Cell"
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
      >
        <Eraser size={20} />
      </button>
    </div>
  );
}
