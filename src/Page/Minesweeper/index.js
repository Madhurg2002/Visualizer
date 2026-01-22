import React, { useState, useEffect, useCallback } from "react";
import Board from "./components/Board";
import { createBoard, reveal, toggleFlag, checkWin, chord } from "./utils/gameLogic";

const DIFFICULTIES = {
  Beginner: { rows: 9, cols: 9, mines: 10 },
  Intermediate: { rows: 16, cols: 16, mines: 40 },
  Expert: { rows: 16, cols: 30, mines: 99 },
};

export default function Minesweeper() {
  const [level, setLevel] = useState("Beginner");
  const [board, setBoard] = useState([]);
  const [status, setStatus] = useState("Playing"); // Playing, Won, Lost
  const [minesLeft, setMinesLeft] = useState(10);
  const [timer, setTimer] = useState(0);

  const [bestTimes, setBestTimes] = useState(() => {
    const saved = localStorage.getItem("minesweeperBestTimes");
    return saved ? JSON.parse(saved) : { Beginner: null, Intermediate: null, Expert: null };
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const resetGame = useCallback((newLevel = level) => {
    let config = { ...DIFFICULTIES[newLevel] };

    // Transpose for mobile if needed (make it vertical)
    if (window.innerWidth < 640 && config.cols > config.rows) {
      const temp = config.rows;
      config.rows = config.cols;
      config.cols = temp;
    }

    setBoard(createBoard(config.rows, config.cols, config.mines));
    setMinesLeft(config.mines);
    setStatus("Playing");
    setTimer(0);
  }, [level]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      if (mobile !== isMobile) {
        setIsMobile(mobile);
        resetGame(); // Trigger reset to apply transpose logic
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, resetGame]);

  // Initialize board
  useEffect(() => {
    resetGame(level);
  }, [level, resetGame]);

  // Timer
  useEffect(() => {
    let interval = null;
    if (status === "Playing") {
      interval = setInterval(() => {
        setTimer((secs) => secs + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);



  const handleCellClick = (x, y) => {
    if (status !== "Playing") return;

    // Safety check for first click? Optional in basic implementation, skipping for now.

    let result;
    if (board[x][y].isOpen) {
      result = chord(board, x, y);
    } else {
      result = reveal(board, x, y);
    }

    // Safety check if result didn't change (e.g. chord condition met but nothing to reveal, or not met)
    if (result.board === board) return;

    setBoard([...result.board]);

    if (result.gameOver) {
      setStatus("Lost");
      revealMovies(result.board);
    } else {
      if (checkWin(result.board)) {
        setStatus("Won");
        flagAllMines(result.board);

        // Update Best Time
        setBestTimes(prev => {
          const currentBest = prev[level];
          if (currentBest === null || timer < currentBest) {
            const newTimes = { ...prev, [level]: timer };
            localStorage.setItem("minesweeperBestTimes", JSON.stringify(newTimes));
            return newTimes;
          }
          return prev;
        });
      }
    }
  };

  const handleRightClick = (e, x, y) => {
    e.preventDefault();
    if (status !== "Playing") return;

    const newBoard = toggleFlag(board, x, y);
    setBoard([...newBoard]);

    // Update mine counter
    const flaggedCount = newBoard.flat().filter(c => c.isFlagged).length;
    setMinesLeft(DIFFICULTIES[level].mines - flaggedCount);
  };

  const revealMovies = (currentBoard) => {
    const newBoard = currentBoard.map(row => row.map(cell => {
      if (cell.isMine) return { ...cell, isOpen: true };
      return cell;
    }));
    setBoard(newBoard);
  };

  const flagAllMines = (currentBoard) => {
    const newBoard = currentBoard.map(row => row.map(cell => {
      if (cell.isMine) return { ...cell, isFlagged: true };
      return cell;
    }));
    setBoard(newBoard);
  };

  // Dynamic width based on difficulty to keep cells reasonable size
  const getContainerWidth = () => {
    switch (level) {
      case 'Beginner': return 'max-w-[400px] w-full';
      case 'Intermediate': return 'max-w-[600px] w-full';
      case 'Expert': return 'max-w-[800px] w-full';
      default: return 'max-w-md';
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center pt-8 text-white font-sans p-4 bg-slate-900">
      <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
        Minesweeper
      </h1>

      <div className={`flex flex-col items-center bg-slate-800 p-6 rounded-xl shadow-2xl mb-8 border border-slate-700 overflow-x-auto scrollbar-hide ${getContainerWidth()}`}>
        {/* Controls */}
        <div className="flex gap-4 mb-6 flex-wrap justify-center">
          {Object.keys(DIFFICULTIES).map((diff) => (
            <button
              key={diff}
              onClick={() => setLevel(diff)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${level === diff
                ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex justify-between w-full mb-4 px-4 font-mono text-xl">
          <div className="flex items-center gap-2">
            <span className="text-red-400">💣</span>
            <span>{minesLeft}</span>
          </div>
          <button
            onClick={() => resetGame()}
            className="text-2xl hover:scale-110 transition-transform active:scale-95"
          >
            {status === "Playing" ? "🙂" : status === "Won" ? "😎" : "😵"}
          </button>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">⏱️</span>
              <span>{String(timer).padStart(3, '0')}</span>
            </div>
            {bestTimes[level] !== null && (
              <div className="text-xs text-green-400 font-bold mt-1">
                Best: {bestTimes[level]}
              </div>
            )}
          </div>
        </div>

        {board.length > 0 && (
          <Board
            board={board}
            onCellClick={handleCellClick}
            onCellRightClick={handleRightClick}
          />
        )}

        {status !== "Playing" && (
          <div className={`mt-4 text-2xl font-bold ${status === "Won" ? "text-green-400" : "text-red-400"}`}>
            {status === "Won" ? "You Won! 🎉" : "Game Over 💥"}
          </div>
        )}
      </div>
    </div>
  );
}
