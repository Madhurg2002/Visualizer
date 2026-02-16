import React from 'react';
import Cell from './Cell';

export default function Board({ board }) {
  return (
    <div className="grid grid-cols-10 gap-[1px] md:gap-0.5 p-1">
      {board.map((row, y) =>
        row.map((cell, x) => <Cell key={`${y}-${x}`} type={cell} />)
      )}
    </div>
  );
}
