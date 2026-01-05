import React, { useState, useCallback, useRef, useEffect } from "react";
import "./Index.css";

const numRows = 30; // 30
const numCols = 50; // 50

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

const generateEmptyGrid = () => {
  const rows = [];
  for (let i = 0; i < numRows; i++) {
    rows.push(Array.from(Array(numCols), () => 0));
  }
  return rows;
};

export default function GameOfLife() {
  const [grid, setGrid] = useState(generateEmptyGrid);
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [speed, setSpeed] = useState(100); // ms
  const [statusMessage, setStatusMessage] = useState("");

  const runningRef = useRef(running);
  runningRef.current = running;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const prevGridStringRef = useRef("");

  useEffect(() => {
    if (!running) {
        prevGridStringRef.current = JSON.stringify(grid); 
        return;
    }

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
      
      // Optional: Stop if static? No, GoL can have oscillators.
      setGeneration((gen) => gen + 1);
      return next;
    });

    setTimeout(runSimulation, speedRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <div className="w-full bg-white shadow-sm p-4 mb-4 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-slate-700 tracking-tight mb-2">
            Conway's Game of Life
        </h1>
        <div className="flex gap-4 items-center flex-wrap justify-center">
            
            <div className="flex gap-2">
                <button
                    className={`px-4 py-2 rounded font-bold shadow transition-colors ${
                    running ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
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
                    {running ? "Stop" : "Start"}
                </button>
                
                <button
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold shadow transition-colors"
                    onClick={() => {
                    setGrid(generateEmptyGrid());
                    setGeneration(0);
                    setRunning(false);
                    setStatusMessage("");
                    }}
                >
                    Clear
                </button>

                <button
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded font-bold shadow transition-colors"
                    onClick={() => {
                    const rows = [];
                    for (let i = 0; i < numRows; i++) {
                        rows.push(
                        Array.from(Array(numCols), () => (Math.random() > 0.7 ? 1 : 0))
                        );
                    }
                    setGrid(rows);
                    setGeneration(0);
                    setStatusMessage("");
                    }}
                >
                    Random
                </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded">
                <span className="text-xs font-bold text-slate-500 uppercase">Speed ({speed}ms)</span>
                <input
                    type="range"
                    min="10"
                    max="1000"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-32 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>
            
            <div className="font-mono font-bold text-lg text-slate-600">
                Generation: {generation}
            </div>

        </div>
        {statusMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative mb-2 animate-pulse">
                <span className="block sm:inline">{statusMessage}</span>
            </div>
        )}
      </div>

      {/* Grid */}
      <div className="relative shadow-2xl border-4 border-slate-700 rounded-sm bg-slate-800 overflow-hidden" 
           style={{
               display: "grid",
               gridTemplateColumns: `repeat(${numCols}, 20px)`
           }}
      >
        {grid.map((rows, i) =>
          rows.map((col, j) => (
            <div
              key={`${i}-${j}`}
              onClick={() => {
                if(running) return;
                const newGrid = JSON.parse(JSON.stringify(grid));
                newGrid[i][j] = grid[i][j] ? 0 : 1;
                setGrid(newGrid);
              }}
              style={{
                width: 20,
                height: 20,
                backgroundColor: grid[i][j] ? "#3b82f6" : undefined, // blue-500
                border: "1px solid #1e293b", // slate-800
              }}
              className={`transition-colors duration-100 cursor-pointer hover:bg-slate-700 ${grid[i][j] ? "animate-pulse-once" : ""}`}
            />
          ))
        )}
      </div>
        
      <div className="mt-6 max-w-2xl text-center text-slate-500 text-sm p-4">
        <p>
            <strong>Rules:</strong> 
            1. Underpopulation: &lt; 2 neighbors dies. 
            2. Survival: 2 or 3 neighbors lives. 
            3. Overpopulation: &gt; 3 neighbors dies. 
            4. Reproduction: Exactly 3 neighbors creates life.
        </p>
      </div>

    </div>
  );
}