import React, { useState, useEffect, useCallback, useRef } from "react";
import Board from "./components/Board";
import NextPiece from "./components/NextPiece";
import useInterval from "./hooks/useInterval";
import { assignRandomColorsToPieces } from "./utils/colorUtils";
import { PRECOMPUTED_TETROMINOS, TETROMINO_NAMES } from "./data/tetrominoes";

const ROWS = 20;
const COLS = 10;

const createBoard = () =>
  Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill("bg-gray-900"));

const createRandomPiece = (colorMap) => {
  const key = TETROMINO_NAMES[Math.floor(Math.random() * TETROMINO_NAMES.length)];
  const weights = [0.25, 0.25, 0.25, 0.25]; // equal weights, can customize per piece
  const rotationIndex = weightedRandom(weights);
  const color = colorMap[key];
  return { key, rotationIndex, color, pos: { x: 3, y: -2 } };
};

function weightedRandom(weights) {
  let sum = 0;
  const r = Math.random();
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r <= sum) return i;
  }
  return weights.length - 1;
}

const checkCollision = (board, shape, pos) => {
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

const mergePiece = (board, piece) => {
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

const clearRows = (board) => {
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
const displayBoardWithPiece = (board, piece) => {
  if (!piece || !piece.key || typeof piece.rotationIndex !== "number")
    return board;
  const tetrominoGroup = PRECOMPUTED_TETROMINOS[piece.key];
  if (!tetrominoGroup) return board;
  const shape = tetrominoGroup[piece.rotationIndex];
  if (!shape) return board;

  const newBoard = board.map((row) => row.slice());
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
  return newBoard;
};

export default function FallingBlocks() {
  const [colorMap, setColorMap] = useState(() => assignRandomColorsToPieces());
  const [board, setBoard] = useState(createBoard());
  const [piece, setPiece] = useState(null);
  const [pieceQueue, setPieceQueue] = useState([]);
  const [dropTime, setDropTime] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const countdownStarted = useRef(false);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('fallingBlocksHighScore') || '0', 10));

  useEffect(() => {
    // ... (existing reset logic)
    setColorMap(assignRandomColorsToPieces());
    setBoard(createBoard());
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setPaused(false);
    setPieceQueue([]);
    setPiece(null);
    setDropTime(null);
    setCountdown(3);
    countdownStarted.current = false;
  }, []);

  const startGame = useCallback(() => {
    const initialQueue = [];
    for (let i = 0; i < 3; i++) initialQueue.push(createRandomPiece(colorMap));
    setPieceQueue(initialQueue);
    const firstPiece = initialQueue[0];
    setPiece(firstPiece);
    setPieceQueue((q) => q.slice(1));
    setDropTime(1000);
  }, [colorMap]);

  useEffect(() => {
    if (!countdownStarted.current && countdown > 0) {
      countdownStarted.current = true;
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            startGame();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  }, [countdown, startGame]);

  const drop = useCallback(() => {
    if (gameOver || paused || !piece) return;
    const shape = PRECOMPUTED_TETROMINOS[piece.key][piece.rotationIndex];
    const newPos = { x: piece.pos.x, y: piece.pos.y + 1 };
    if (!checkCollision(board, shape, newPos))
      setPiece((p) => ({ ...p, pos: newPos }));
    else {
      let newBoard = mergePiece(board, piece);
      const { newBoard: clearedBoard, cleared } = clearRows(newBoard);
      if (cleared > 0) {
        setScore((s) => s + cleared * 100);
        if (score + cleared * 100 >= level * 1000) setLevel((l) => l + 1);
      }
      setBoard(clearedBoard);
      if (pieceQueue.length === 0)
        setPieceQueue((q) => [...q, createRandomPiece(colorMap)]);
      const next = pieceQueue[0];
      const nextShape = PRECOMPUTED_TETROMINOS[next.key][next.rotationIndex];
      if (checkCollision(clearedBoard, nextShape, { x: 3, y: -2 })) {
        setGameOver(true);
        setDropTime(null);
      } else {
        setPiece({ ...next, pos: { x: 3, y: -2 } });
        setPieceQueue((q) => q.slice(1).concat(createRandomPiece(colorMap)));
      }
    }
  }, [board, piece, gameOver, level, paused, pieceQueue, score, colorMap]);

  useEffect(() => {
    if (!gameOver && !paused && dropTime !== null)
      setDropTime(Math.max(1000 - (level - 1) * 100, 100));
  }, [level, gameOver, paused]);

  useInterval(drop, dropTime);

  // High score effect
  useEffect(() => {
    if (gameOver) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('fallingBlocksHighScore', score.toString());
      }
    }
  }, [gameOver, score, highScore]);

  const move = (dir) => {
    if (gameOver || paused || !piece) return;
    const shape = PRECOMPUTED_TETROMINOS[piece.key][piece.rotationIndex];
    const newPos = { x: piece.pos.x + dir, y: piece.pos.y };
    if (!checkCollision(board, shape, newPos))
      setPiece((p) => ({ ...p, pos: newPos }));
  };

  const rotatePiece = () => {
    if (gameOver || paused || !piece) return;
    const newRotationIndex = (piece.rotationIndex + 1) % 4;
    const newShape = PRECOMPUTED_TETROMINOS[piece.key][newRotationIndex];
    if (!checkCollision(board, newShape, piece.pos)) {
      setPiece((p) => ({ ...p, rotationIndex: newRotationIndex }));
    }
  };

  const dropPiece = () => {
    if (!gameOver && !paused) setDropTime(50);
  };

  const hardDrop = () => {
    if (gameOver || paused || !piece) return;
    const shape = PRECOMPUTED_TETROMINOS[piece.key][piece.rotationIndex];
    let y = piece.pos.y;
    while (!checkCollision(board, shape, { x: piece.pos.x, y: y + 1 })) y++;
    setPiece((p) => ({ ...p, pos: { x: p.pos.x, y } }));
    setDropTime(100);
  };

  const togglePause = () => {
    if (gameOver) return;
    if (paused) {
      setDropTime(Math.max(1000 - (level - 1) * 100, 100));
      setPaused(false);
    } else {
      setDropTime(null);
      setPaused(true);
    }
  };

  const restartGame = () => {
    setColorMap(assignRandomColorsToPieces());
    setBoard(createBoard());
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setPaused(false);
    setPieceQueue([]);
    setPiece(null);
    setDropTime(null);
    setCountdown(3);
    countdownStarted.current = false;
  };

  const handleKeyDown = (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) {
      e.preventDefault();
    }

    if (e.repeat) return;
    if (countdown > 0) return;

    if (e.key === "ArrowLeft") move(-1);
    else if (e.key === "ArrowRight") move(1);
    else if (e.key === "ArrowDown") dropPiece();
    else if (e.key === "ArrowUp") rotatePiece();
    else if (e.key === " ") {
      hardDrop();
    } else if (e.key.toLowerCase() === "p") togglePause();
  };

  const handleKeyUp = (e) => {
    if (e.key === "ArrowDown" && !gameOver && !paused)
      setDropTime(Math.max(1000 - (level - 1) * 100, 100));
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  });

  // Render Section
  return (
    <div className="text-white flex flex-col items-center space-y-6 p-4 md:p-8 select-none min-h-screen touch-none">
      <h1 className="text-4xl font-bold mb-2">Falling Blocks</h1>
      <div className="flex gap-8 flex-wrap justify-center">
        <Board
          board={displayBoardWithPiece(
            board,
            piece || { shape: [], pos: { x: 0, y: 0 }, color: "" }
          )}
        />
        <div className="flex flex-col items-center space-y-6 max-w-xs">
          <div className="space-y-4 w-full">
            <NextPiece
              pieceQueue={pieceQueue.filter(Boolean).map((next) => ({
                ...next,
                shape: PRECOMPUTED_TETROMINOS[next.key][next.rotationIndex],
              }))}
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">Score: {score}</p>
            <p className="font-semibold text-lg text-yellow-400">High Score: {highScore}</p>
            <p className="font-semibold text-lg">Level: {level}</p>
            {paused && <p className="mt-4 text-yellow-400 text-xl">Paused</p>}
          </div>
          <div className="flex space-x-4">
            {/* ... existing buttons ... */}
            <button
              onClick={togglePause}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={restartGame}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Restart
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden grid grid-cols-3 gap-4 mt-8">
        <div className="flex items-center justify-center">
          <button
            className="w-16 h-16 bg-slate-700 rounded-full active:bg-slate-600 shadow-lg"
            onTouchStart={(e) => { e.preventDefault(); rotatePiece(); }}
            onClick={(e) => { e.preventDefault(); rotatePiece(); }}
          >
            ↻
          </button>
        </div>
        <div className="flex items-center justify-center">
          <button
            className="w-16 h-16 bg-slate-700 rounded-full active:bg-slate-600 shadow-lg font-bold text-xl"
            onTouchStart={(e) => { e.preventDefault(); move(0); /* No-op just for symmetry mapping? Or maybe Up is rotate? */ rotatePiece(); }}
            onClick={rotatePiece}
          >
            ▲
          </button>
        </div>
        <div className="flex items-center justify-center">
          {/* Empty or auxiliary */}
        </div>

        <div className="flex items-center justify-center">
          <button
            className="w-16 h-16 bg-slate-700 rounded-full active:bg-slate-600 shadow-lg font-bold text-xl"
            onTouchStart={(e) => { e.preventDefault(); move(-1); }}
            onClick={() => move(-1)}
          >
            ◀
          </button>
        </div>
        <div className="flex items-center justify-center">
          <button
            className="w-16 h-16 bg-slate-700 rounded-full active:bg-slate-600 shadow-lg font-bold text-xl"
            onTouchStart={(e) => { e.preventDefault(); dropPiece(); }}
            onClick={dropPiece}
          >
            ▼
          </button>
        </div>
        <div className="flex items-center justify-center">
          <button
            className="w-16 h-16 bg-slate-700 rounded-full active:bg-slate-600 shadow-lg font-bold text-xl"
            onTouchStart={(e) => { e.preventDefault(); move(1); }}
            onClick={() => move(1)}
          >
            ▶
          </button>
        </div>

        <div className="col-span-3 flex justify-center mt-2">
          <button
            className="w-full max-w-[200px] h-16 bg-red-600 rounded-full active:bg-red-500 shadow-lg font-bold text-xl"
            onTouchStart={(e) => { e.preventDefault(); hardDrop(); }}
            onClick={hardDrop}
          >
            DROP
          </button>
        </div>
      </div>

      <p className="text-gray-400 mt-4 select-text-none max-w-xl text-center hidden md:block">
        Controls: Arrow keys to move/rotate, Space for hard drop, P to
        pause/resume
      </p>
    </div>
  );
}
