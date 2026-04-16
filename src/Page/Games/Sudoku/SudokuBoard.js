import React from "react";
import SudokuCell from "./SudokuCell";

export default function SudokuBoard({
  board,
  lockedCells,
  isWrong,
  hintCell,
  errorCell,
  userEditedAfterHint,
  selected,
  setSelected,
  onCellClick,
  solution,
  win,
  themeColors,
  highlightValue,
  theme,
  notes, 
  highlightGuides,
}) {
  return (
    <div
      style={{
        margin: "0 auto 28px auto",
        display: "grid",
        gridTemplateColumns: "repeat(9, 1fr)",
        userSelect: "none",
        borderRadius: 14,
        overflow: "hidden",
        width: "100%",
        maxWidth: 500,
        background: themeColors.boardBg,
        boxShadow: `0px 8px 32px rgba(0, 0, 0, 0.12)`,
        border: `4px solid ${themeColors.boardBorder}`,
        aspectRatio: "1/1",
      }}
    >
        {board.flat().map((val, i) => {
          const r = Math.floor(i / 9);
          const c = i % 9;
          const key = `${r}-${c}`;
          const isLocked = lockedCells.has(key);
          const wrong = isWrong.has(key);
          const isHint = hintCell === key && !userEditedAfterHint.current;
          const isError = errorCell === key && !userEditedAfterHint.current;
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
                isError={isError}
                isSelected={isSelected}
                isHighlight={isHighlight}
                isGuide={isGuide}
                notes={cellNotes}
                highlightValue={highlightValue}
                themeColors={themeColors}
                theme={theme}
                onCellClick={onCellClick}
                win={win}
                size={3}
            />
          );
        })}
    </div>
  );
}
