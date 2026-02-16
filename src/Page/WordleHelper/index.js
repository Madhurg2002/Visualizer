
import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, HelpCircle, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WORDS } from './words';
import { filterWords, getBestGuess, sortCandidates } from './solver';

const WordleHelper = () => {
    const navigate = useNavigate();

    // State
    // Grid: 6 rows x 5 cols
    // Each cell: { char: '', status: 'absent' | 'present' | 'correct' }
    const [grid, setGrid] = useState(Array(6).fill(null).map(() => 
        Array(5).fill({ char: '', status: 'absent' })
    ));
    const [currentRow, setCurrentRow] = useState(0);
    const [candidates, setCandidates] = useState(WORDS);
    const [bestGuess, setBestGuess] = useState({ likely: null, eliminator: null });

    // Handle input change
    const handleInput = (row, col, value) => {
        if (row !== currentRow) return;
        const newGrid = [...grid];
        newGrid[row][col] = { ...newGrid[row][col], char: value.toUpperCase() };
        setGrid(newGrid);

        // Auto-focus next
        if (value && col < 4) {
            const nextInput = document.getElementById(`cell-${row}-${col + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    // Handle status toggle
    const toggleStatus = (row, col) => {
        // if (row !== currentRow) return; // Allow toggling past rows? Maybe constraints change.
        // Better to only allow editing current row or past rows to correct mistakes.
        // Let's allow editing any filled cell.
        const cell = grid[row][col];
        if (!cell.char) return;

        const newStatus = cell.status === 'absent' ? 'present' 
                        : cell.status === 'present' ? 'correct' 
                        : 'absent';
        
        const newGrid = [...grid];
        newGrid[row][col] = { ...cell, status: newStatus };
        setGrid(newGrid);
    };

    // Calculate candidates on change
    useEffect(() => {
        // Filter based on ALL filled rows
        let newCandidates = [...WORDS];

        grid.forEach(row => {
            const word = row.map(c => c.char).join('');
            if (word.length !== 5) return; // Skip incomplete rows? Or incomplete words?
            // Actually we should filter incrementally. 
            // If row is full, apply filter.
            if (row.every(c => c.char)) {
                // Construct feedback array
                const feedback = row.map(c => c.status);
                newCandidates = filterWords(newCandidates, word, feedback);
            }
        });

        const sortedCandidates = sortCandidates(newCandidates);
        setCandidates(sortedCandidates);
        setBestGuess(getBestGuess(sortedCandidates));

    }, [grid]);

    // Go to next row
    const handleEnter = () => {
        if (currentRow < 5 && grid[currentRow].every(c => c.char)) {
            setCurrentRow(prev => prev + 1);
        }
    };

    // Fill current row with word
    const fillRow = (word) => {
        if (currentRow >= 6) return;
        const newGrid = [...grid];
        const row = newGrid[currentRow];
        word.split('').forEach((char, i) => {
            row[i] = { ...row[i], char, status: 'absent' };
        });
        setGrid(newGrid);
        
        // Auto-focus last input? Or first?
        // Maybe better to just focus the first one.
    };

    // Reset
    const handleReset = () => {
        setGrid(Array(6).fill(null).map(() => Array(5).fill({ char: '', status: 'absent' })));
        setCurrentRow(0);
        setCandidates(WORDS);
        setBestGuess({ likely: null, eliminator: null });
    };

    const StatusColors = {
        absent: 'bg-slate-700 text-white border-slate-600',
        present: 'bg-yellow-500 text-white border-yellow-500',
        correct: 'bg-green-500 text-white border-green-500'
    };

    return (
        <div className="flex h-screen w-full bg-[#0B0C15] font-sans overflow-hidden text-slate-300">
             
            {/* Background Ambience */}
             <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-30">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-green-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-yellow-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Main Content (Left) */}
            <div className="flex-1 flex flex-col relative h-full z-10 p-6 items-center justify-center">
                
                 {/* Header Overlay */}
                 <div className="absolute top-6 left-6 z-20">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all w-fit"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>

                <div className="max-w-md w-full">
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400 mb-2">
                            Wordle Helper
                        </h1>
                        <p className="text-slate-500 text-sm">Type guess, tap tile to change color</p>
                    </div>

                    {/* Grid */}
                    <div className="flex flex-col gap-2">
                        {grid.map((row, rowIndex) => (
                            <div key={rowIndex} className={`flex gap-2 justify-center ${rowIndex > currentRow ? 'opacity-30' : ''}`}>
                                {row.map((cell, colIndex) => (
                                    <input
                                        key={colIndex}
                                        id={`cell-${rowIndex}-${colIndex}`}
                                        type="text"
                                        maxLength={1}
                                        value={cell.char}
                                        onChange={(e) => handleInput(rowIndex, colIndex, e.target.value)}
                                        onClick={() => toggleStatus(rowIndex, colIndex)}
                                        disabled={rowIndex !== currentRow} // Only edit current row? Or allow correcting past? 
                                        // Let's restrict typing to current row, but toggling to any row for correction?
                                        // Actually simplest for user is sequential.
                                        className={`w-14 h-14 text-3xl font-bold text-center uppercase rounded-lg border-2 outline-none transition-all cursor-pointer select-none
                                            ${StatusColors[cell.status]} ${rowIndex === currentRow ? 'focus:border-white' : 'border-transparent'}
                                        `}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-4 justify-center">
                        <button onClick={handleReset} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all">
                            <RotateCcw size={20} />
                        </button>
                        <button 
                            onClick={handleEnter}
                            disabled={currentRow >= 5}
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                        >
                            Next Row
                        </button>
                    </div>

                </div>
            </div>

            {/* Sidebar (Right) */}
            <div className="w-80 h-full bg-slate-900/80 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col shadow-2xl z-20 overflow-hidden">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-2">
                    Analysis
                </div>
                
                {/* Best Guess - Likely */}
                <div 
                    onClick={() => bestGuess?.likely && fillRow(bestGuess.likely)}
                    className="mb-4 p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/20 cursor-pointer hover:border-green-500/40 transition-all active:scale-[0.98]"
                >
                    <div className="text-xs uppercase font-bold text-green-400 mb-1">Most Likely</div>
                    <div className="text-3xl font-black text-white tracking-widest">
                        {bestGuess?.likely || "?"}
                    </div>
                </div>

                {/* Best Guess - Eliminator */}
                {bestGuess?.eliminator && (bestGuess.eliminator !== bestGuess.likely) && (
                    <div 
                        onClick={() => fillRow(bestGuess.eliminator)}
                        className="mb-6 p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/20 cursor-pointer hover:border-yellow-500/40 transition-all active:scale-[0.98]"
                    >
                        <div className="text-xs uppercase font-bold text-yellow-400 mb-1">Best Eliminator</div>
                        <div className="text-3xl font-black text-white tracking-widest">
                            {bestGuess.eliminator}
                        </div>
                    </div>
                )}

                {/* Candidates List */}
                <div className="flex-1 overflow-hidden flex flex-col">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Possible Words</span>
                        <span className="text-xs font-mono text-cyan-400">{candidates.length}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                        {candidates.slice(0, 100).map((word, i) => (
                            <button 
                                key={i} 
                                onClick={() => fillRow(word)}
                                className="w-full text-left px-3 py-2 bg-slate-800/50 hover:bg-slate-700/80 rounded-lg text-sm font-medium text-slate-300 border border-white/5 cursor-pointer transition-colors"
                            >
                                {word}
                            </button>
                        ))}
                        {candidates.length > 100 && (
                            <div className="text-center text-xs text-slate-500 py-2">
                                + {candidates.length - 100} more...
                            </div>
                        )}
                         {candidates.length === 0 && (
                            <div className="text-center text-sm text-red-400 py-8">
                                No words match! Check your constraints.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WordleHelper;
