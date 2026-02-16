import React, { useState, useEffect, useCallback } from "react";
import Board from "./components/Board";
import { createBoard, reveal, toggleFlag, checkWin, chord } from "./utils/gameLogic";
import { Bomb, Flag, Timer, Trophy, RefreshCw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

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
  const [showLevelMenu, setShowLevelMenu] = useState(false);

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
      case 'Beginner': return 'max-w-[400px] md:max-w-[500px] w-full';
      case 'Intermediate': return 'max-w-[600px] md:max-w-[700px] w-full';
      case 'Expert': return 'max-w-[900px] w-full';
      default: return 'max-w-md';
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center pt-8 text-white font-sans p-4 bg-[#0B0C15] overflow-x-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-900/20 rounded-full blur-[100px]" />
      </div>

      <h1 className="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-sm z-10">
        Minesweeper
      </h1>

      <div className={`relative flex flex-col items-center bg-slate-900/60 backdrop-blur-xl p-1 rounded-3xl shadow-2xl mb-8 border border-white/10 z-10 transition-all duration-500 ease-in-out ${getContainerWidth()}`}>
        
        {/* Header / Stats Bar */}
        <div className="w-full bg-black/40 rounded-2xl p-4 mb-1 flex items-center justify-between border-b border-white/5">
            
            {/* Mines Left */}
            <div className="flex items-center gap-3 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                <Bomb className="text-red-400" size={24} />
                <span className="font-mono text-2xl font-bold text-red-50">{minesLeft}</span>
            </div>

            {/* Reset Button (Emoji) */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => resetGame()}
                className="text-4xl bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors border border-white/10 shadow-lg"
            >
                {status === "Playing" ? "🙂" : status === "Won" ? "😎" : "😵"}
            </motion.button>

            {/* Timer */}
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-3 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
                    <Timer className="text-blue-400" size={24} />
                    <span className="font-mono text-2xl font-bold text-blue-50 w-[60px] text-right">{String(timer).padStart(3, '0')}</span>
                </div>
            </div>
        </div>

        {/* Difficulty Selector & Best Time */}
        <div className="w-full flex justify-between items-center px-4 py-3">
             <div className="relative">
                <button 
                    onClick={() => setShowLevelMenu(!showLevelMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-300 transition-colors border border-white/5"
                >
                    {level} <ChevronDown size={16} />
                </button>
                
                <AnimatePresence>
                    {showLevelMenu && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px]"
                        >
                            {Object.keys(DIFFICULTIES).map((diff) => (
                                <button
                                    key={diff}
                                    onClick={() => { setLevel(diff); setShowLevelMenu(false); }}
                                    className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-white/5 transition-colors ${level === diff ? 'text-yellow-400 bg-white/5' : 'text-slate-400'}`}
                                >
                                    {diff}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>

             {bestTimes[level] !== null && (
                <div className="flex items-center gap-2 text-yellow-400/80 text-sm font-bold bg-yellow-400/10 px-3 py-1.5 rounded-lg">
                    <Trophy size={14} /> Best: {bestTimes[level]}s
                </div>
             )}
        </div>

        {/* Game Board Wrapper */}
        <div className="bg-black/20 p-2 rounded-2xl border border-white/5 overflow-hidden">
            {board.length > 0 && (
            <Board
                board={board}
                onCellClick={handleCellClick}
                onCellRightClick={handleRightClick}
            />
            )}
        </div>
        
        {/* Game Over / Win Banner */}
         <AnimatePresence>
            {status !== "Playing" && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className={`mt-6 mb-2 px-8 py-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-4 ${
                        status === "Won" 
                        ? "bg-green-500/20 border-green-500/30 text-green-300" 
                        : "bg-red-500/20 border-red-500/30 text-red-300"
                    }`}
                >
                    <span className="text-3xl">{status === "Won" ? "🎉" : "💥"}</span>
                    <div>
                        <h3 className="text-xl font-black uppercase text-white">{status === "Won" ? "Victory!" : "Game Over"}</h3>
                        <div className="flex gap-4 mt-2">
                             <button
                                onClick={() => resetGame()}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2"
                             >
                                <RefreshCw size={14} /> Play Again
                             </button>
                        </div>
                    </div>
                </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}
