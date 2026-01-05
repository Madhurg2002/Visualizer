import React from "react";

export default function SudokuBoard({
  board,
  lockedCells,
  isWrong,
  hintCell,
  userEditedAfterHint,
  selected,
  setSelected,
  onCellClick,
  solution,
  win,
  themeColors,
  highlightValue,
  theme, // Added theme prop
}) {
  const size = 3;

  return (
    <table
      style={{
        margin: "0 auto 28px auto",
        borderCollapse: "collapse",
        userSelect: "none",
        borderRadius: 14,
        overflow: "hidden",
        width: "100%",
        maxWidth: 450,
        background: themeColors.boardBg,
        boxShadow: `0px 8px 32px rgba(0, 0, 0, 0.12)`,
        border: `4px solid ${themeColors.boardBorder}`,
      }}
    >
      <tbody>
        {board.map((row, r) => (
          <tr key={r}>
            {row.map((val, c) => {
              const key = `${r}-${c}`;
              const isLocked = lockedCells.has(key);
              const wrong = isWrong.has(key);
              const isHintCell = hintCell === key && !userEditedAfterHint.current;
              const isSelected = selected && r === selected[0] && c === selected[1];

              const isHighlight = highlightValue && val === highlightValue && val !== 0;

              const thickBorderColor = themeColors.boardBorder;
              const thinBorderColor = theme === "dark" ? "#475569" : "#ddd";

              const borderTop = r % size === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;
              const borderLeft = c % size === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;
              const borderRight = (c + 1) % size === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;
              const borderBottom = (r + 1) % size === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;

              const isBoxEdge = r % size === 0 || (r + 1) % size === 0 || c % size === 0 || (c + 1) % size === 0;
              const boxShadow = isBoxEdge ? `0 0 8px ${thickBorderColor}` : undefined;

              const boxShaded = (Math.floor(r / size) + Math.floor(c / size)) % 2 === 0;

              let bgColor = themeColors.bg;
              if (isHintCell) bgColor = themeColors.hintBg;
              else if (isHighlight) bgColor = themeColors.numberHighlightBg;
              else if (wrong) bgColor = themeColors.wrongCellBg;
              else if (isLocked) bgColor = themeColors.lockedCellBg;
              else if (val !== 0) bgColor = themeColors.normalCellBg;

              if (theme === "dark" && boxShaded && !isHintCell && !isHighlight && !wrong && !isLocked) {
                bgColor = "#2f3b55"; // subtle alternate dark shading
              }

              let cellColor = isLocked
                ? themeColors.lockedCellTextColor
                : wrong
                ? themeColors.wrongCellTextColor
                : isHintCell
                ? themeColors.hintTextColor
                : themeColors.numberBtnColor;

              return (
                <td
                  key={key}
                  tabIndex={isLocked || win ? -1 : 0}
                  onClick={() => !isLocked && !win && onCellClick(r, c)}
                  style={{
                    width: 48,
                    height: 48,
                    fontSize: isHintCell ? 26 : 24,
                    fontWeight: isLocked ? "700" : isHintCell ? "900" : "500",
                    backgroundColor: bgColor,
                    borderTop,
                    borderLeft,
                    borderRight,
                    borderBottom,
                    color: cellColor,
                    textAlign: "center",
                    verticalAlign: "middle",
                    cursor: isLocked || win ? "default" : "pointer",
                    outline: isSelected ? `3px solid ${themeColors.selectedCellBorder}` : "none",
                    userSelect: "none",
                    transition: "background-color 0.25s, box-shadow 0.25s, outline-color 0.2s",
                    boxShadow:
                      isHighlight
                        ? "0 0 0 3px #facc15"
                        : isHintCell
                        ? `0 0 0 3px ${themeColors.hintBorder}`
                        : boxShadow,
                    animation: isHintCell ? "hintBlink 1s infinite" : undefined,
                  }}
                  aria-selected={isSelected}
                  title={isHintCell ? "Hint" : undefined}
                >
                  {isHintCell ? solution[r][c] : val || ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
