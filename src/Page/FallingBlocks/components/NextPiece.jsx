import React from 'react';
import Cell from './Cell';

export default function NextPiece({ pieceQueue }) {
  if (!pieceQueue || pieceQueue.length === 0) {
    return (
      <div className="p-2 bg-gray-800 rounded-lg shadow-md select-none">
        <h3 className="text-white mb-2 font-semibold text-center">Next Pieces</h3>
        <div className="text-center text-gray-400">No upcoming pieces</div>
      </div>
    );
  }

  const size = 4;
  const emptyRow = new Array(size).fill(0);

  const renderShapeGrid = (piece) => {
    const shape = piece.shape || [];
    const board = [];

    for (let y = 0; y < size; y++) {
      if (y < shape.length) {
        board.push([
          ...shape[y],
          ...emptyRow.slice(0, size - shape[y].length),
        ]);
      } else {
        board.push(emptyRow);
      }
    }

    return (
      <div className="grid grid-cols-4 gap-1 bg-gray-900 rounded w-32 h-32 mb-4">
        {board.map((row, y) =>
          row.map((cell, x) => (
            <Cell
              key={`${y}-${x}`}
              type={cell !== 0 ? piece.color : 'bg-gray-900'}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div className="p-2 bg-gray-800 rounded-lg shadow-md select-none">
      <h3 className="text-white mb-4 font-semibold text-center text-lg">
        Next Pieces
      </h3>
      {pieceQueue.map((piece, idx) => (
        <div key={idx}>
          <div className="text-white mb-1 text-center">#{idx + 1}</div>
          {renderShapeGrid(piece)}
        </div>
      ))}
    </div>
  );
}
