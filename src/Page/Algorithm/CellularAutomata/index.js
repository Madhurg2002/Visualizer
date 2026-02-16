import React, { useState, useCallback, useRef, useEffect } from "react";
import { Play, Pause, Trash2, Shuffle, RefreshCw, Settings, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import "./Index.css";

const operations = [
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
  [-1, -1],
  [1, 0],
  [-1, 0],
];

export default function GameOfLife() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const getDimensions = useCallback(() => {
    return isMobile ? { rows: 40, cols: 20 } : { rows: 30, cols: 50 };
  }, [isMobile]);

  const generateEmptyGrid = useCallback(() => {
    const { rows, cols } = getDimensions();
    const gridRows = [];
    for (let i = 0; i < rows; i++) {
      gridRows.push(Array.from(Array(cols), () => 0));
    }
    return gridRows;
  }, [getDimensions]);

  const [grid, setGrid] = useState(generateEmptyGrid);
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [speed, setSpeed] = useState(100); // ms
  const [statusMessage, setStatusMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const runningRef = useRef(running);
  runningRef.current = running;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const prevGridStringRef = useRef("");

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      if (mobile !== isMobile) {
        setIsMobile(mobile);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Reset grid when dimensions change
  useEffect(() => {
    setRunning(false);
    setGrid(generateEmptyGrid());
    setGeneration(0);
    setStatusMessage("");
  }, [generateEmptyGrid]);

  useEffect(() => {
    if (!running) {
      prevGridStringRef.current = JSON.stringify(grid);
      return;
    }

    const numRows = grid.length;
    const numCols = grid[0].length;

    // 1. Check Empty
    let hasLife = false;
    // Check if any cell is alive
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (grid[r][c] === 1) {
          hasLife = true;
          break;
        }
      }
      if (hasLife) break;
    }

    if (!hasLife) {
      setRunning(false);
      runningRef.current = false;
      setStatusMessage("Population has died out!");
      return;
    }

    // 2. Check Stable (Constant)
    const currentGridString = JSON.stringify(grid);
    if (currentGridString === prevGridStringRef.current) {
      setRunning(false);
      runningRef.current = false; // Ensure simulation loop stops
      setStatusMessage("Population has stabilized!");
    }
    prevGridStringRef.current = currentGridString;
  }, [grid, running]);

  const runSimulation = useCallback(() => {
    if (!runningRef.current) {
      return;
    }

    setGrid((g) => {
      const numRows = g.length;
      const numCols = g[0].length;
      const next = g.map((row, i) => {
        return row.map((cell, j) => {
          let neighbors = 0;
          operations.forEach(([x, y]) => {
            const newI = i + x;
            const newJ = j + y;
            if (newI >= 0 && newI < numRows && newJ >= 0 && newJ < numCols) {
              neighbors += g[newI][newJ];
            }
          });

          if (neighbors < 2 || neighbors > 3) {
            return 0;
          } else if (cell === 0 && neighbors === 3) {
            return 1;
          } else {
            return cell;
          }
        });
      });

      setGeneration((gen) => gen + 1);
      return next;
    });

    setTimeout(runSimulation, speedRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0B0C15] text-slate-200 font-sans relative overflow-hidden">
        
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <div className="w-full p-6 z-10 flex justify-between items-center max-w-7xl">
        <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all font-bold group"
        >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
        </button>

        <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-lg">
                GAME OF LIFE
            </h1>
            <div className="font-mono text-cyan-400/80 text-sm mt-1 tracking-widest">
                GEN: {generation}
            </div>
        </div>

        <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-3 rounded-full border transition-all ${showInfo ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800/50 border-white/10 text-slate-400 hover:text-white'}`}
        >
            <Info size={20} />
        </button>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="absolute top-24 right-6 z-20 w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Info size={20} className="text-cyan-400" /> Rules
            </h3>
            <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex gap-2"><span className="text-red-400 font-bold">1.</span> <span>Underpopulation: &lt; 2 neighbors dies.</span></li>
                <li className="flex gap-2"><span className="text-green-400 font-bold">2.</span> <span>Survival: 2 or 3 neighbors lives.</span></li>
                <li className="flex gap-2"><span className="text-red-400 font-bold">3.</span> <span>Overpopulation: &gt; 3 neighbors dies.</span></li>
                <li className="flex gap-2"><span className="text-cyan-400 font-bold">4.</span> <span>Reproduction: Exactly 3 neighbors creates life.</span></li>
            </ul>
        </div>
      )}

      {/* Grid Container */}
      <div className="flex-1 flex items-center justify-center p-4 z-10 w-full overflow-auto">
        <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700/50 rounded-lg bg-slate-900/80 backdrop-blur-sm overflow-hidden"
            style={{
            display: "grid",
            gridTemplateColumns: `repeat(${grid[0].length}, 20px)`
            }}
        >
            {grid.map((rows, i) =>
            rows.map((col, j) => (
                <div
                key={`${i}-${j}`}
                onClick={() => {
                    if (running) return;
                    const newGrid = JSON.parse(JSON.stringify(grid));
                    newGrid[i][j] = grid[i][j] ? 0 : 1;
                    setGrid(newGrid);
                }}
                style={{
                    width: 20,
                    height: 20,
                }}
                className={`
                    border border-slate-800/50 transition-all duration-200 cursor-pointer
                    ${grid[i][j] 
                        ? "bg-cyan-500 shadow-[inset_0_0_8px_rgba(255,255,255,0.5)] animate-pulse-once" 
                        : "bg-transparent hover:bg-white/5"
                    }
                `}
                />
            ))
            )}
        </div>
      </div>

      {statusMessage && (
          <div className="absolute top-32 z-30 bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-2 rounded-full backdrop-blur-md shadow-lg animate-pulse font-bold tracking-wide">
            {statusMessage}
          </div>
      )}

      {/* Controls */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-3 rounded-full shadow-2xl">
            
            {/* Play/Pause */}
            <button
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${running 
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50" 
                    : "bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:scale-105 border border-cyan-400"
                }`}
                onClick={() => {
                    setRunning(!running);
                    if (!running) {
                        setStatusMessage("");
                        runningRef.current = true;
                        runSimulation();
                    }
                }}
            >
                {running ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>

            <div className="w-px h-8 bg-white/10 mx-2"></div>

            {/* Empty/Clear */}
            <button
              className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Clear Board"
              onClick={() => {
                setGrid(generateEmptyGrid());
                setGeneration(0);
                setRunning(false);
                setStatusMessage("");
              }}
            >
              <Trash2 size={22} />
            </button>

            {/* Random */}
            <button
              className="p-3 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-full transition-colors"
              title="Randomize"
              onClick={() => {
                const { rows, cols } = getDimensions();
                const newRows = [];
                for (let i = 0; i < rows; i++) {
                  newRows.push(
                    Array.from(Array(cols), () => (Math.random() > 0.7 ? 1 : 0))
                  );
                }
                setGrid(newRows);
                setGeneration(0);
                setStatusMessage("");
              }}
            >
              <Shuffle size={22} />
            </button>

            <div className="w-px h-8 bg-white/10 mx-2"></div>

            {/* Speed Control */}
            <div className="flex items-center gap-3 px-3">
                <Settings size={18} className="text-slate-500" />
                <div className="flex flex-col w-32">
                    <input
                        type="range"
                        min="10"
                        max="1000"
                        value={1010 - speed} // Invert slider so right is faster
                        onChange={(e) => setSpeed(1010 - Number(e.target.value))}
                        className="h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase mt-1">
                        <span>Slow</span>
                        <span>Fast</span>
                    </div>
                </div>
            </div>

        </div>
      </div>

    </div>
  );
}