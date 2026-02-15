import React from "react";
import SudokuCell from "./SudokuCell";

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
  theme,
  notes, // New Prop
  highlightGuides, // New Prop
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
              const isHint = hintCell === key && !userEditedAfterHint.current;
              const isSelected = selected && r === selected[0] && c === selected[1];

              const isHighlight = highlightValue && val === highlightValue && val !== 0;
              const isGuide = highlightGuides && selected && (r === selected[0] || c === selected[1]);

              const cellNotes = notes ? notes[key] : null;

              return (
                <SudokuCell
                    key={key}
                    r={r}
                    c={c}
                    val={val}
                    isLocked={isLocked}
                    isWrong={wrong}
                    isHint={isHint}
                    isSelected={isSelected}
                    isHighlight={isHighlight}
                    isGuide={isGuide}
                    notes={cellNotes}
                    highlightValue={highlightValue}
                    themeColors={themeColors}
                    theme={theme}
                    onCellClick={onCellClick}
                    win={win}
                    size={size}
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
