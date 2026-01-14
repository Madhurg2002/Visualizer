import React from 'react';
import Cell from './Cell';

export default function Board({ board }) {
  return (
    <div className="grid grid-cols-10 gap-0.5 bg-gray-800 p-2 rounded shadow-lg">
      {board.map((row, y) =>
        row.map((cell, x) => <Cell key={`${y}-${x}`} type={cell} />)
      )}
    </div>
  );
}
