import React from 'react';
import Cell from './Cell';

export default function NextPiece({ pieceQueue }) {
  if (!pieceQueue || pieceQueue.length === 0) {
    return (
      <div className="w-full text-center text-slate-500 py-4 text-sm font-medium">
        No upcoming pieces
      </div>
    );
  }

  // Only show first 3 next pieces to save space/matching the redesign
  const nextPiecesToShow = pieceQueue.slice(0, 3);
  const size = 4;
  const emptyRow = new Array(size).fill(0);

  const renderShapeGrid = (piece) => {
    const shape = piece.shape || [];
    const board = [];

    // Creating a 4x2 or 4x3 grid depending on the shape to be more compact
    // Actually standard 4x2 usually fits most except "I" rotated
    const gridRows = 2; 
    
    // We'll stick to the logic but just render small
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

    // Filter empty rows to compact the view? No, keep it simple for now but smaller.
    // Actually, let's just render the grid tight.
    
    return (
      <div className="grid grid-cols-4 gap-0.5 p-1 rounded-lg bg-black/20 border border-white/5 w-20 h-20 flex items-center justify-center content-center">
        {board.map((row, y) =>
          row.map((cell, x) => (
             // Only render if we want full grid, or just the piece?
             // Let's render full grid but transparent for empty
            <div key={`${y}-${x}`} className={`w-4 h-4 rounded-[1px] ${cell !== 0 ? piece.color : 'bg-transparent'}`}></div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-row justify-center gap-4 w-full">
      {nextPiecesToShow.map((piece, idx) => (
         renderShapeGrid(piece)
      ))}
    </div>
  );
}
