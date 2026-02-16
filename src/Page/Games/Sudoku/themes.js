// src/Page/Sudoku/themes.js
export const THEMES = {
  light: {
    bg: "#f8fafc",
    boardBg: "#ffffff", // White board on light bg
    boardBorder: "#2563eb",
    lockedCellBg: "#dbeafe",
    lockedCellTextColor: "#1e293b",
    selectedCellBorder: "#22d3ee",
    wrongCellBg: "#fca5a5",
    wrongCellTextColor: "#7f1d1d",
    normalCellBg: "#ffffff",
    numberBtnBg: "#e0e7ff",
    numberBtnSelBg: "#2563eb",
    numberBtnColor: "#334155",
    numberBtnSelColor: "#fff",
    numberHighlightBg: "#fde68a",
    hintBg: "#e0f7fa",
    hintBorder: "#00bcd4",
    hintTextColor: "#0ea5e9",
    // New
    noteColor: "#64748b",
    guideHighlightBg: "#f1f5f9", // subtle highlight for row/col/box
    noteBtnActiveBg: "#6366f1",
    text: "#0f172a",
  },
  dark: {
    bg: "#0B0C15", // Main App Background
    boardBg: "#151925", // Darker panel
    boardBorder: "#38bdf8", // Cyan border
    lockedCellBg: "#151925", // Match board
    lockedCellTextColor: "#94a3b8", // Slate 400
    selectedCellBorder: "#c084fc", // Purple
    wrongCellBg: "#450a0a",
    wrongCellTextColor: "#fca5a5",
    normalCellBg: "#1e293b", // Slate 800
    numberBtnBg: "#1e293b",
    numberBtnSelBg: "#38bdf8", // Cyan
    numberBtnColor: "#f1f5f9",
    numberBtnSelColor: "#000000",
    numberHighlightBg: "#172554", // Blue 950
    hintBg: "#134e4a",
    hintBorder: "#2dd4bf",
    hintTextColor: "#ccfbf1",
    // New
    noteColor: "#94a3b8",
    guideHighlightBg: "#1e293b",
    noteBtnActiveBg: "#a855f7",
    text: "#ffffff",
  },
};
