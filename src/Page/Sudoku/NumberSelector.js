// src/Page/Sudoku/NumberSelector.js
import React from "react";

export default function NumberSelector({ selected, setSelected, themeColors }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 14,
        marginTop: 24,
        flexWrap: "nowrap",
        userSelect: "none",
      }}
    >
      {[...Array(9)].map((_, i) => {
        const n = i + 1;
        const isSelected = selected === n;
        return (
          <button
            key={n}
            onClick={() => setSelected(isSelected ? null : n)}
            style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              border: isSelected ? `3px solid ${themeColors.numberBtnSelBg}` : `2px solid #b0bec5`,
              backgroundColor: isSelected ? themeColors.numberBtnSelBg : themeColors.numberBtnBg,
              color: isSelected ? themeColors.numberBtnSelColor : themeColors.numberBtnColor,
              fontWeight: 700,
              fontSize: 24,
              cursor: "pointer",
              boxShadow: isSelected ? `0 0 12px ${themeColors.numberBtnSelBg}` : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            aria-pressed={isSelected}
            aria-label={`Select number ${n}`}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
