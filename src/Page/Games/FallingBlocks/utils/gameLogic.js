import { PRECOMPUTED_TETROMINOS, TETROMINO_NAMES } from "../data/tetrominoes";
import { assignRandomColorsToPieces } from "./colorUtils";

export const ROWS = 20;
export const COLS = 10;

export const createBoard = () =>
  Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill("bg-gray-900"));

export function weightedRandom(weights) {
  let sum = 0;
  const r = Math.random();
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r <= sum) return i;
  }
  return weights.length - 1;
}

export const createRandomPiece = (colorMap) => {
  const key = TETROMINO_NAMES[Math.floor(Math.random() * TETROMINO_NAMES.length)];
  const weights = [0.25, 0.25, 0.25, 0.25];
  const rotationIndex = weightedRandom(weights);
  const color = colorMap[key];
  return { key, rotationIndex, color, pos: { x: 3, y: -2 } };
};

export const checkCollision = (board, shape, pos) => {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const px = pos.x + x;
        const py = pos.y + y;
        if (
          px < 0 ||
          px >= COLS ||
          py >= ROWS ||
          (py >= 0 && board[py][px] !== "bg-gray-900")
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

export const mergePiece = (board, piece) => {
  const newBoard = board.map((row) => row.slice());
  const shape = PRECOMPUTED_TETROMINOS[piece.key][piece.rotationIndex];
  shape.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val !== 0) {
        const px = piece.pos.x + x;
        const py = piece.pos.y + y;
        if (py >= 0 && py < ROWS && px >= 0 && px < COLS)
          newBoard[py][px] =
            piece.color + " transition-colors duration-300 ease-in-out";
      }
    });
  });
  return newBoard;
};

export const clearRows = (board) => {
  const newBoard = [];
  let cleared = 0;
  for (let y = 0; y < board.length; y++) {
    if (board[y].every((cell) => cell !== "bg-gray-900")) cleared++;
    else newBoard.push(board[y]);
  }
  for (let i = 0; i < cleared; i++)
    newBoard.unshift(Array(COLS).fill("bg-gray-900"));
  return { newBoard, cleared };
};

export const getGhostPosition = (board, piece) => {
    if (!piece) return null;
    const shape = PRECOMPUTED_TETROMINOS[piece.key][piece.rotationIndex];
    let ghostY = piece.pos.y;
    
    // Drop ghost until collision
    while (!checkCollision(board, shape, { x: piece.pos.x, y: ghostY + 1 })) {
        ghostY++;
    }
    return { x: piece.pos.x, y: ghostY };
};

export const displayBoardWithPiece = (board, piece, ghostPiece = null) => {
    // 1. Clone board (or create fresh rendering buffer if performance blocked)
    const newBoard = board.map((row) => row.slice());

    // 2. Render Ghost Piece first (so it's behind)
    if (ghostPiece && piece) {
        const shape = PRECOMPUTED_TETROMINOS[piece.key][piece.rotationIndex];
        const ghostColor = piece.color.replace("bg-", "bg-opacity-20 bg-"); // Hacky transparency or separate class
        
        // Actually, Tailwind classes usually end with color like bg-red-500.
        // We can append opacity class or use style.
        // Let's rely on a specific class for ghost if possible.
        // Or just use a lighter shade?
        // Let's assume we pass a ghost color or class.
        
        shape.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val !== 0) {
                    const px = ghostPiece.x + x;
                    const py = ghostPiece.y + y;
                    if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
                         // Only draw ghost if cell is empty
                         if (newBoard[py][px] === "bg-gray-900") {
                             newBoard[py][px] = "bg-white/10 border-2 border-white/20"; // Ghost style
                         }
                    }
                }
            });
        });
    }

    // 3. Render Active Piece
    if (piece && piece.key && typeof piece.rotationIndex === "number") {
        const tetrominoGroup = PRECOMPUTED_TETROMINOS[piece.key];
        if (tetrominoGroup) {
            const shape = tetrominoGroup[piece.rotationIndex];
            if (shape) {
                shape.forEach((row, y) => {
                    row.forEach((val, x) => {
                        if (val !== 0) {
                            const px = piece.pos.x + x;
                            const py = piece.pos.y + y;
                            if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
                                newBoard[py][px] = piece.color;
                            }
                        }
                    });
                });
            }
        }
    }
    return newBoard;
};
