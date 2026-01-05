// src/Page/Sudoku/themes.js
export const THEMES = {
  light: {
    bg: "#f8fafc",
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
  },
  dark: {
    bg: "#0f172a", // darker background
    boardBorder: "#2563eb",
    lockedCellBg: "#5090a0", // more subdued locked color
    lockedCellTextColor: "#e0e7ff",
    selectedCellBorder: "#38bdf8",
    wrongCellBg: "#f87171", // slightly brighter background
    wrongCellTextColor: "#7f1d1d", // darker text for contrast
    normalCellBg: "linear-gradient(145deg, #2e3a52, #38455f)", // subtle gradient
    numberBtnBg: "#536987", // lighter base button bg
    numberBtnSelBg: "#60a5fa",
    numberBtnColor: "#e0e7ff",
    numberBtnSelColor: "#fff",
    numberHighlightBg: "#fbbf24", // warmer highlight
    hintBg: "#134e4a",
    hintBorder: "#2dd4bf",
    hintTextColor: "#7dd3fc",
  },
};
