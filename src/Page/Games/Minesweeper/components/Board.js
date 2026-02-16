import React from "react";
import Cell from "./Cell";

export default function Board({ board, onCellClick, onCellRightClick }) {
  return (
    <div
      className="grid bg-slate-800 p-2 rounded shadow-lg border-2 border-slate-600 select-none gap-[1px]"
      style={{ gridTemplateColumns: `repeat(${board[0].length}, minmax(23px, 1fr))` }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => (
          <Cell
            key={`${r}-${c}`}
            data={cell}
            onClick={() => onCellClick(r, c)}
            onContextMenu={(e) => onCellRightClick(e, r, c)}
          />
        ))
      )}
    </div>
  );
}
