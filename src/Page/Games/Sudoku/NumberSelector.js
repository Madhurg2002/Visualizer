import React from "react";

export default function NumberSelector({ selected, setSelected, themeColors }) {
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
        return (
          <button
            key={n}
            onClick={() => setSelected(isSelected ? null : n)}
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
              cursor: "pointer",
              boxShadow: isSelected
                ? `0 0 12px ${themeColors.numberBtnSelBg}`
                : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            aria-pressed={isSelected}
            aria-label={`Select number ${n}`}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.95)")
            }
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
