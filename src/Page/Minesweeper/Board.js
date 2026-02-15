import React from "react";
import Cell from "./Cell";

export default function Board({ board, onCellClick, onCellRightClick }) {
  return (
    <div className="flex flex-col select-none relative">
      <div className="absolute inset-0 bg-black/40 rounded-xl pointer-events-none" />
      {board.map((row, r) => (
        <div key={r} className="flex z-10">
          {row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              data={cell}
              onClick={() => onCellClick(r, c)}
              onContextMenu={(e) => onCellRightClick(e, r, c)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
