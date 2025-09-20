// src/Page/Sudoku/SudokuBoard.js
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
}) {
  const size = 3;

  const getCellBg = (r, c) => {
    const key = `${r}-${c}`;
    if (hintCell === key && !userEditedAfterHint.current)
      return themeColors.lockedCellBg;
    if (isWrong.has(key)) return themeColors.wrongCellBg;
    if (lockedCells.has(key)) return themeColors.lockedCellBg;
    if (board[r][c] !== 0) return themeColors.normalCellBg;
    return themeColors.bg;
  };

  return (
    <table
      style={{
        margin: "0 auto 28px auto",
        borderCollapse: "collapse",
        userSelect: "none",
        borderRadius: 12,
        overflow: "hidden",
        width: "100%",
        maxWidth: 450,
        backgroundColor: themeColors.bg,
        boxShadow: `0px 8px 24px rgba(0, 0, 0, 0.12)`,
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
              const isHint = hintCell === key && !userEditedAfterHint.current;
              const isSelected =
                selected && r === selected[0] && c === selected[1];
              const bgColor = getCellBg(r, c);

              const borderTop =
                r % size === 0
                  ? `3px solid ${themeColors.boardBorder}`
                  : "1px solid #ddd";
              const borderLeft =
                c % size === 0
                  ? `3px solid ${themeColors.boardBorder}`
                  : "1px solid #ddd";
              const borderRight =
                (c + 1) % size === 0
                  ? `3px solid ${themeColors.boardBorder}`
                  : "1px solid #ddd";
              const borderBottom =
                (r + 1) % size === 0
                  ? `3px solid ${themeColors.boardBorder}`
                  : "1px solid #ddd";

              return (
                <td
                  key={key}
                  tabIndex={isLocked || win ? -1 : 0}
                  onClick={() => !isLocked && !win && onCellClick(r, c)}
                  style={{
                    width: 48,
                    height: 48,
                    fontSize: 24,
                    fontWeight: isLocked ? "700" : "500",
                    backgroundColor: bgColor,
                    borderTop,
                    borderLeft,
                    borderRight,
                    borderBottom,
                    color: isLocked
                      ? themeColors.lockedCellTextColor
                      : wrong
                      ? themeColors.wrongCellTextColor
                      : themeColors.numberBtnColor,

                    textAlign: "center",
                    verticalAlign: "middle",
                    cursor: isLocked || win ? "default" : "pointer",
                    outline: isSelected
                      ? `3px solid ${themeColors.selectedCellBorder}`
                      : "none",
                    userSelect: "none",
                  }}
                  aria-selected={isSelected}
                >
                  {isHint ? solution[r][c] : val || ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
