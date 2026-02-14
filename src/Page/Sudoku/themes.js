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
  },
  dark: {
    bg: "#020617", // Slate 950 - Deep rich background
    boardBg: "#0f172a", // Slate 900
    boardBorder: "#334155", // Slate 700 - Subtler than blue
    lockedCellBg: "#1e293b", // Slate 800
    lockedCellTextColor: "#f8fafc", // Slate 50
    selectedCellBorder: "#38bdf8", // Sky 400 - Pop of color for selection
    wrongCellBg: "#450a0a", // Red 950 - Deepest red
    wrongCellTextColor: "#fca5a5", // Red 300
    normalCellBg: "#0f172a", // Match board bg
    numberBtnBg: "#1e293b", // Slate 800
    numberBtnSelBg: "#3b82f6", // Blue 500
    numberBtnColor: "#f1f5f9",
    numberBtnSelColor: "#ffffff",
    numberHighlightBg: "#172554", // Blue 950 - Very subtle same-number highlight
    hintBg: "#134e4a", // Teal 900
    hintBorder: "#2dd4bf", // Teal 400
    hintTextColor: "#ccfbf1",
    // New
    noteColor: "#94a3b8", // Slate 400 - Distinct from value
    guideHighlightBg: "#1e293b", // Subtle guide highlight (same as locked cell)
    noteBtnActiveBg: "#a855f7", // Purple 500
  },
};
