import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Crown, ArrowLeft, Settings, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './NQueens.css';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const NQueens = () => {
    const navigate = useNavigate();
    const [n, setN] = useState(8); 
    const [speed, setSpeed] = useState(500); 
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false); // New paused state
    const [board, setBoard] = useState([]);
    const [solutionsCount, setSolutionsCount] = useState(0);
    const [foundSolutions, setFoundSolutions] = useState([]);
    const [viewingSolutionIndex, setViewingSolutionIndex] = useState(-1); 
    const [status, setStatus] = useState('Idle'); 
    const [attackedCells, setAttackedCells] = useState(new Set()); 
    const [currentCell, setCurrentCell] = useState(null); 

    const runningRef = useRef(false);
    const pausedRef = useRef(false); // Ref for immediate access in loop
    const speedRef = useRef(speed);
    const nRef = useRef(n);
    const boardRef = useRef([]); 

    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { nRef.current = n; }, [n]);

    const initializeBoard = useCallback(() => {
        const newBoard = Array(n).fill().map(() => Array(n).fill(0));
        setBoard(newBoard);
        boardRef.current = newBoard;
        setSolutionsCount(0);
        setFoundSolutions([]);
        setViewingSolutionIndex(-1);
        setStatus('Idle');
        setAttackedCells(new Set());
        setCurrentCell(null);
        setRunning(false);
        setPaused(false);
        runningRef.current = false;
        pausedRef.current = false;
    }, [n]);

    useEffect(() => {
        initializeBoard();
    }, [initializeBoard]);

    const isSafe = (board, r, c, n) => {
        for (let i = 0; i < r; i++) {
            if (board[i][c] === 1) return false;
        }
        for (let i = r, j = c; i >= 0 && j >= 0; i--, j--) {
            if (board[i][j] === 1) return false;
        }
        for (let i = r, j = c; i >= 0 && j < n; i--, j++) {
            if (board[i][j] === 1) return false;
        }
        return true;
    };

    const solve = async (r) => {
        if (!runningRef.current) return false;

        // Pause Loop
        while (pausedRef.current) {
            if (!runningRef.current) return false;
            await sleep(100);
        }

        if (r === nRef.current) {
            const solution = boardRef.current.map(row => [...row]);
            setFoundSolutions(prev => [...prev, solution]);
            setSolutionsCount(s => s + 1);
            
            await sleep(speedRef.current * 2);

            // Pause check again after finding solution
            while (pausedRef.current) {
                if (!runningRef.current) return false;
                await sleep(100);
            }

            return false;
        }

        for (let c = 0; c < nRef.current; c++) {
            if (!runningRef.current) return false;
            
            // Pause Loop check inside inner loop too for responsiveness
            while (pausedRef.current) {
                if (!runningRef.current) return false;
                await sleep(100);
            }

            setCurrentCell({ r, c });
            
            const safe = isSafe(boardRef.current, r, c, nRef.current);
            
            if (safe) {
                boardRef.current[r][c] = 1;
                setBoard([...boardRef.current]);
                setAttackedCells(new Set());
                await sleep(speedRef.current);

                if (await solve(r + 1)) return true;

                boardRef.current[r][c] = 0;
                setBoard([...boardRef.current]);
                await sleep(speedRef.current / 2); 
            } else {
                 if (speedRef.current > 50) {
                     setAttackedCells(getCellConflicts(boardRef.current, r, c, nRef.current));
                     await sleep(speedRef.current / 2);
                 }
            }
        }
        return false;
    };

    const getCellConflicts = (board, r, c, n) => {
        const conflicts = new Set();
        for (let i = 0; i < r; i++) {
            if (board[i][c] === 1) conflicts.add(`${i}-${c}`);
        }
        for (let i = r-1, j = c-1; i >= 0 && j >= 0; i--, j--) {
            if (board[i][j] === 1) conflicts.add(`${i}-${j}`);
        }
        for (let i = r-1, j = c+1; i >= 0 && j < n; i--, j++) {
            if (board[i][j] === 1) conflicts.add(`${i}-${j}`);
        }
        conflicts.add(`${r}-${c}`);
        return conflicts;
    }

    const startVisualization = async () => {
        if (running) {
            // Already running? No, we use togglePause for that.
            // But if status is 'Completed', restart.
             if (status === 'Completed') {
                initializeBoard();
                // small delay to let state settle?
                setTimeout(() => startVisualization(), 10);
                return;
             }
             return;
        }
        
        // Initial Start
        setRunning(true);
        runningRef.current = true;
        setPaused(false);
        pausedRef.current = false;
        setStatus('Running');
        setViewingSolutionIndex(-1); 
        
        await solve(0);
        
        setRunning(false);
        runningRef.current = false;
        setStatus('Completed');
        setAttackedCells(new Set());
        setCurrentCell(null);
    };

    const togglePause = () => {
        if (!running) return;
        
        const newPaused = !paused;
        setPaused(newPaused);
        pausedRef.current = newPaused;
        setStatus(newPaused ? 'Paused' : 'Running');
    };

    const stopVisualization = () => {
        setRunning(false);
        runningRef.current = false;
        setPaused(false);
        pausedRef.current = false;
        setStatus('Idle'); // Or reset?
        // Actually Stop usually means Reset in these visualizers
        initializeBoard();
    };

    const getCellSize = () => {
        if (n <= 8) return 'w-12 h-12 md:w-16 md:h-16';
        if (n <= 12) return 'w-8 h-8 md:w-12 md:h-12';
        return 'w-6 h-6 md:w-8 md:h-8';
    };

    const displayBoard = viewingSolutionIndex !== -1 ? foundSolutions[viewingSolutionIndex] : board;

    return (
        <div className="min-h-screen bg-[#0B0C15] text-white flex flex-col items-center p-4 relative overflow-hidden font-sans">
             <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-pink-900/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-5xl z-10 flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all font-bold group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back</span>
                </button>

                <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-lg text-center">
                    N-Queens Visualizer
                </h1>

                <div className="w-24 hidden md:block"></div> 
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl z-10">
                
                <div className="flex flex-col gap-4">
                    <div className="relative p-2 rounded-xl bg-gradient-to-br from-white/10 to-transparent shadow-2xl backdrop-blur-md border border-white/10">
                        <div className="bg-[#1e293b] rounded-lg overflow-hidden border border-slate-700 shadow-inner">
                            <div 
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${n}, 1fr)`,
                                }}
                                className="bg-slate-800"
                            >
                                {displayBoard.map((row, r) => 
                                    row.map((cell, c) => {
                                        const isDark = (r + c) % 2 === 1;
                                        const isAttacked = viewingSolutionIndex === -1 && attackedCells.has(`${r}-${c}`);
                                        const isCurrent = viewingSolutionIndex === -1 && currentCell && currentCell.r === r && currentCell.c === c;
                                        
                                        return (
                                            <div 
                                                key={`${r}-${c}`}
                                                className={`
                                                    aspect-square flex items-center justify-center relative transition-colors duration-200
                                                    ${isDark ? 'bg-slate-700/50' : 'bg-slate-600/30'}
                                                    ${isAttacked ? 'bg-red-500/50 !important' : ''}
                                                    ${isCurrent ? 'bg-yellow-500/30 ring-inset ring-2 ring-yellow-400' : ''}
                                                    ${getCellSize()}
                                                `}
                                            >
                                                {cell === 1 && (
                                                    <div className="animate-scale-in text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]">
                                                        <Crown size={n > 12 ? 16 : n > 8 ? 24 : 32} fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {solutionsCount > 0 && (
                        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg">
                            <button 
                                onClick={() => setViewingSolutionIndex(prev => Math.max(0, (prev === -1 ? solutionsCount - 1 : prev) - 1))}
                                disabled={foundSolutions.length === 0}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-50"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Viewing Solution</span>
                                <span className="text-lg font-bold text-white">
                                    {viewingSolutionIndex === -1 ? "Live" : `${viewingSolutionIndex + 1} / ${solutionsCount}`}
                                </span>
                            </div>

                            <button 
                                onClick={() => setViewingSolutionIndex(prev => Math.min(solutionsCount - 1, (prev === -1 ? 0 : prev) + 1))}
                                disabled={foundSolutions.length === 0}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-50"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6 w-full max-w-sm">
                    
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Status</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                status === 'Running' ? 'bg-green-500/20 text-green-400 animate-pulse' :
                                status === 'Paused' ? 'bg-yellow-500/20 text-yellow-400' :
                                status === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-slate-700 text-slate-400'
                            }`}>
                                {status.toUpperCase()}
                            </span>
                        </div>
                        <div className="text-4xl font-mono font-bold text-white mb-2">
                            {solutionsCount} <span className="text-lg text-slate-500 font-sans">Solutions Found</span>
                        </div>
                         <p className="text-slate-500 text-sm">
                            Backtracking algorithm trying to place {n} queens on an {n}x{n} board so that no two queens attack each other.
                        </p>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                        
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-slate-300 font-bold flex items-center gap-2">
                                     Board Size (N)
                                </label>
                                <span className="text-purple-400 font-mono font-bold">{n}</span>
                            </div>
                            <input
                                type="range"
                                min="4"
                                max="12" 
                                value={n}
                                onChange={(e) => {
                                    if(running) return;
                                    setN(Number(e.target.value));
                                }}
                                disabled={running}
                                className={`w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 ${running ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <p className="text-xs text-slate-500 mt-1">Limited to 12 for performance (Backtracking is O(N!))</p>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-slate-300 font-bold flex items-center gap-2">
                                     <Settings size={16} /> Visualization Speed
                                </label>
                                <span className="text-purple-400 font-mono font-bold">{1010 - speed}ms</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="1000"
                                value={1010 - speed} 
                                onChange={(e) => setSpeed(1010 - Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase mt-1">
                                <span>Slow</span>
                                <span>Fast</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <button
                                onClick={running ? togglePause : startVisualization}
                                className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                                    ${running && !paused
                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30' 
                                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 hover:scale-105'
                                    }
                                `}
                            >
                                {running && !paused ? <><Pause size={20} /> Pause</> : <><Play size={20} /> {paused ? "Resume" : "Start"}</>}
                            </button>
                            
                            <button
                                onClick={stopVisualization}
                                className="py-3 rounded-xl font-bold bg-slate-700/50 text-slate-300 border border-white/10 hover:bg-slate-600/50 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={20} /> Reset
                            </button>
                        </div>
                        
                        {solutionsCount > 0 && (
                            <button 
                                onClick={() => setViewingSolutionIndex(prev => prev === -1 ? 0 : -1)}
                                className="py-2 text-sm text-center text-slate-400 hover:text-white border-t border-slate-700 pt-4 mt-2"
                            >
                                {viewingSolutionIndex === -1 ? "View Saved Solutions" : "Return to Live View"}
                            </button>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
};

export default NQueens;
