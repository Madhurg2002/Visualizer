import React, { useState, useEffect, useCallback, useRef } from "react";
import Board from "./components/Board";
import NextPiece from "./components/NextPiece";
import useInterval from "./hooks/useInterval";
import { assignRandomColorsToPieces } from "./utils/colorUtils";
import { PRECOMPUTED_TETROMINOS } from "./data/tetrominoes";
import { 
    createBoard, 
    createRandomPiece, 
    checkCollision, 
    mergePiece, 
    clearRows, 
    getGhostPosition,
    displayBoardWithPiece
} from "./utils/gameLogic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, Pause, Play, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FallingBlocks() {
  const navigate = useNavigate();
  const [colorMap, setColorMap] = useState(() => assignRandomColorsToPieces());
  const [board, setBoard] = useState(createBoard());
  const [piece, setPiece] = useState(null);
  const [ghostPiece, setGhostPiece] = useState(null);
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
    setColorMap(assignRandomColorsToPieces());
    setBoard(createBoard());
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setPaused(false);
    setPieceQueue([]);
    setPiece(null);
    setGhostPiece(null);
    setDropTime(null);
    setCountdown(3);
    countdownStarted.current = false;
  }, []);

  // Update Ghost Piece whenever piece or board changes
  useEffect(() => {
      if (piece && !gameOver && !paused) {
          setGhostPiece(getGhostPosition(board, piece));
      } else {
          setGhostPiece(null);
      }
  }, [piece, board, gameOver, paused]);

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
    setGhostPiece(null);
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

  const ControlButton = ({ onClick, icon: Icon, label, color = "slate", large = false, ...props }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => { e.preventDefault(); onClick && onClick(e); }}
      onTouchStart={(e) => { e.preventDefault(); onClick && onClick(e); }}
      className={`
        relative overflow-hidden rounded-2xl shadow-lg border border-white/10 backdrop-blur-md
        flex items-center justify-center transition-all duration-200
        ${large ? 'w-full h-16' : 'w-14 h-14 md:w-16 md:h-16'}
        bg-gradient-to-br from-${color}-500/20 to-${color}-600/10 hover:from-${color}-500/30 hover:to-${color}-600/20
        ${props.className || ''}
      `}
      {...props}
    >
        <Icon size={large ? 32 : 28} className={`text-${color}-400 filter drop-shadow-md`} />
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-[#0B0C15] text-white flex flex-col items-center justify-center p-4 md:p-8 select-none touch-none overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-5xl z-10 flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-8 max-w-2xl">
            <button onClick={() => navigate('/')} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-slate-400 hover:text-white">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tight">
                Falling Blocks
            </h1>
            <div className="w-12"></div> {/* Spacer */}
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start justify-center w-full">
            
            {/* Game Board Container */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative p-1 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 shadow-2xl backdrop-blur-xl border border-white/10"
            >
                <div className="bg-[#0f172a]/80 rounded-xl overflow-hidden">
                    <Board
                        board={displayBoardWithPiece(
                            board,
                            piece || { shape: [], pos: { x: 0, y: 0 }, color: "" },
                            ghostPiece
                        )}
                    />
                </div>

                {/* Overlays */}
                <AnimatePresence>
                    {countdown > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.5 }}
                            key={countdown}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl z-20"
                        >
                            <span className="text-9xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                {countdown}
                            </span>
                        </motion.div>
                    )}
                    
                    {gameOver && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-xl z-30 p-6 text-center"
                        >
                            <h2 className="text-4xl font-black text-white mb-2">Game Over</h2>
                            <p className="text-slate-300 mb-6">Final Score: <span className="text-blue-400 font-bold">{score}</span></p>
                            <button 
                                onClick={restartGame}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white shadow-lg hover:shadow-blue-500/20 hover:scale-105 transition-all"
                            >
                                Play Again
                            </button>
                        </motion.div>
                    )}

                    {paused && !gameOver && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl z-20"
                        >
                            <div className="bg-black/50 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Pause size={24} /> Paused
                                </h2>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Side Panel (Score, Next, Controls) */}
            <div className="flex flex-col gap-6 w-full max-w-sm">
                
                {/* Stats Card */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="grid grid-cols-2 gap-4 text-center mb-6">
                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-1">Score</span>
                            <span className="text-2xl font-mono font-bold text-white">{score}</span>
                        </div>
                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-1">Best</span>
                            <span className="text-2xl font-mono font-bold text-yellow-400">{highScore}</span>
                        </div>
                        <div className="bg-black/20 rounded-xl p-3 border border-white/5 col-span-2 flex justify-between items-center px-6">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Level</span>
                            <span className="text-2xl font-mono font-bold text-purple-400">{level}</span>
                        </div>
                    </div>

                     {/* Next Piece */}
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col items-center min-h-[120px] justify-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2 w-full text-left">Next</span>
                         <NextPiece
                            pieceQueue={pieceQueue.filter(Boolean).map((next) => ({
                                ...next,
                                shape: PRECOMPUTED_TETROMINOS[next.key][next.rotationIndex],
                            }))}
                        />
                    </div>
                </div>

                {/* PC/Tablet Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={togglePause}
                        className={`flex-1 py-3 rounded-xl font-bold border border-white/10 transition-all flex items-center justify-center gap-2
                            ${paused ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}
                        `}
                    >
                        {paused ? <><Play size={18}/> Resume</> : <><Pause size={18}/> Pause</>}
                    </button>
                    <button
                        onClick={restartGame}
                        className="flex-1 py-3 bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} /> Restart
                    </button>
                </div>

                {/* Mobile D-Pad Controls (Hidden on larger desktop, visible on touch/mobile) */}
                <div className="grid grid-cols-3 gap-3 md:hidden mt-4">
                     <ControlButton onClick={rotatePiece} icon={RefreshCw} color="purple" />
                     <ControlButton onClick={rotatePiece} icon={ChevronUp} color="slate" />
                     <div /> {/* Spacer */}
                     
                     <ControlButton onClick={() => move(-1)} icon={ChevronLeft} color="slate" />
                     <ControlButton onClick={dropPiece} icon={ChevronDown} color="slate" />
                     <ControlButton onClick={() => move(1)} icon={ChevronRight} color="slate" />
                     
                     <div className="col-span-3 mt-2">
                        <ControlButton onClick={hardDrop} icon={Zap} color="blue" large={true} />
                     </div>
                </div>
                
                <p className="text-slate-500 text-sm text-center hidden md:block mt-4">
                    Use Arrow Keys to Move & Rotate <br/> Space to Drop • P to Pause
                </p>

            </div>
        </div>
      </div>
    </div>
  );
}
