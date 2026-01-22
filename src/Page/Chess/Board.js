
import React from 'react';
import { motion } from 'framer-motion';
import { PieceMap } from './Pieces'; // Ensure this matches export

// Helper for Pieces
const Piece = ({ type, color }) => {
    const Component = PieceMap[color][type];
    return Component ? <Component className="w-full h-full drop-shadow-lg" /> : null;
};

const Board = ({ board, onSquareClick, selectedSquare, possibleMoves, rotation = false, bestMoveHint = null }) => {

    // Logic.jsBoard is always 8x8.
    // If rotation is true (Black View), we want visual Top-Left to be 7,7?
    // No, standard Chess board:
    // White View: 0,0 (Top-Left) is a8. piece is r (Black Rook).
    // Wait. My board array `board[0][0]` is Black Rook.
    // Row 0 is Top (Black side). Row 7 is Bottom (White side).
    // White View: I want Row 0 at Top. Row 7 at Bottom.
    // Black View: I want Row 7 at Top. Row 0 at Bottom.

    // White View (Default): Row 0 (Black) at Top. Row 7 (White) at Bottom.
    // Black View (Flipped): Row 7 (White) at Top. Row 0 (Black) at Bottom.
    const rows = rotation ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const cols = rotation ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    return (
        <div className="w-full max-w-lg aspect-square bg-slate-800 rounded-lg overflow-hidden shadow-2xl grid grid-rows-8 border-4 border-slate-700 select-none">
            {rows.map((row) => (
                <div key={row} className="grid grid-cols-8">
                    {cols.map((col) => {
                        const piece = board[row][col];
                        // Light square if (row+col) is even? 
                        // 0,0 (a8) is Light. (0+0)%2=0. Correct.
                        // 0,1 (b8) is Dark. (0+1)%2=1. Correct.
                        const isLight = (row + col) % 2 === 0;
                        const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
                        const validMove = possibleMoves.find(m => m.row === row && m.col === col);
                        const isPossibleMove = !!validMove;
                        const isCapture = validMove && validMove.capture;

                        // Hint Logic
                        const isHintFrom = bestMoveHint && bestMoveHint.from.row === row && bestMoveHint.from.col === col;
                        const isHintTo = bestMoveHint && bestMoveHint.to.row === row && bestMoveHint.to.col === col;
                        const isHint = isHintFrom || isHintTo;

                        // Click Logic
                        // If my turn, I click my piece (row, col)
                        // onSquareClick expects (row, col) indices of the board array.

                        return (
                            <div
                                key={`${row}-${col}`}
                                onClick={() => onSquareClick(row, col)}
                                className={`
                                    relative flex items-center justify-center cursor-pointer
                                    ${isLight ? 'bg-[#EBECD0]' : 'bg-[#739552]'}
                                    ${isSelected ? 'after:absolute after:inset-0 after:bg-yellow-400/50' : ''}
                                    ${isHint ? 'ring-inset ring-4 ring-blue-400/60' : ''}
                                `}
                            >
                                {/* Rank/File Markers */}
                                {/* Show Only on edges of the View */}
                                {/* Top-Left Corner of View depends on rotation */}
                                {/* Just show for specific visual rows/cols */}

                                {/* Rank (Numbers): Left side. Visual Column 0.
                                    If rotation (Flip), Visual Col 0 is Logical Col 7.
                                    If !rotation, Visual Col 0 is Logical Col 0.
                                */}
                                {col === (rotation ? 7 : 0) && (
                                    <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${isLight ? 'text-[#739552]' : 'text-[#EBECD0]'}`}>
                                        {/* If rotation (Black View), visual top row is 0, which is Rank 1. Visual bottom is 7 (Rank 8). 
                                            Wait, logical row 0 is Rank 8. logical row 7 is Rank 1.
                                            White View (0..7): Top is 0 (8). Bottom is 7 (1). Formula: 8 - row.
                                            Black View (7..0): Top is 7 (1). Bottom is 0 (8). Formula: 8 - row.
                                            Actually the Formula 8-row relies on the 'row' variable being the LOGICAL row index.
                                            In White View, Top Div has key=0. 8-0=8. Correct.
                                            In Black View, Top Div has key=7. 8-7=1. Correct. 
                                            So logic is fine. */
                                            8 - row}
                                    </span>
                                )}

                                {/* File (Letters): Bottom side */}
                                {row === (rotation ? 0 : 7) && (
                                    <span className={`absolute bottom-0 right-1 text-[10px] font-bold ${isLight ? 'text-[#739552]' : 'text-[#EBECD0]'}`}>
                                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][col]}
                                    </span>
                                )}

                                {/* Move Indicators */}
                                {isPossibleMove && !isCapture && (
                                    <div className="absolute w-3 h-3 bg-black/20 rounded-full z-10" />
                                )}
                                {isPossibleMove && isCapture && (
                                    <div className="absolute inset-0 border-[6px] border-black/10 rounded-full z-10" />
                                )}

                                {/* Piece */}
                                {piece && (
                                    <div className="w-[85%] h-[85%] z-20 transition-transform duration-200">
                                        <Piece type={piece.type} color={piece.color} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Board;
