
import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, HelpCircle, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WORDS } from './words';
import { filterWords, getBestGuess, sortCandidates } from './solver';
import Confetti from '../../Components/Confetti';


const WordleHelper = () => {
    const navigate = useNavigate();

    // Mode: 'helper' | 'play'
    const [mode, setMode] = useState('helper');
    
    // State
    const [grid, setGrid] = useState(Array(6).fill(null).map(() => 
        Array(5).fill({ char: '', status: 'absent' })
    ));
    const [currentRow, setCurrentRow] = useState(0);
    const [candidates, setCandidates] = useState(WORDS);
    const [bestGuess, setBestGuess] = useState({ likely: null, eliminator: null });
    

    
    const [targetWord, setTargetWord] = useState('');
    const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'

    useEffect(() => {
        if (mode === 'play') {
            startNewGame();
        } else {
            handleReset();
        }
    }, [mode]);

    const startNewGame = () => {
        const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        setTargetWord(randomWord);
        setGameState('playing');
        setGrid(Array(6).fill(null).map(() => Array(5).fill({ char: '', status: 'absent' })));
        setCurrentRow(0);
        setCandidates(WORDS);
        setBestGuess({ likely: null, eliminator: null });
    };

    // Handle input change
    const handleInput = (row, col, value) => {
        if (row !== currentRow || gameState !== 'playing') return;
        const newGrid = [...grid];
        newGrid[row][col] = { ...newGrid[row][col], char: value.toUpperCase() };
        setGrid(newGrid);

        // Auto-focus next
        if (value && col < 4) {
            const nextInput = document.getElementById(`cell-${row}-${col + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    // Handle status toggle (Helper Mode Only)
    const toggleStatus = (row, col) => {
        if (mode === 'play') return; // Disable in play mode
        
        const cell = grid[row][col];
        if (!cell.char) return;

        const newStatus = cell.status === 'absent' ? 'present' 
                        : cell.status === 'present' ? 'correct' 
                        : 'absent';
        
        const newGrid = [...grid];
        newGrid[row][col] = { ...cell, status: newStatus };
        setGrid(newGrid);
    };



    // Check Word (Play Mode) or Submit status (Helper Mode)
    const handleEnter = () => {
        const rowData = grid[currentRow];
        const guess = rowData.map(c => c.char).join('');
        
        if (guess.length !== 5) return;

        if (mode === 'play') {
            // Validate word
            if (!WORDS.includes(guess)) {
                alert("Not in word list");
                return;
            }

            // Calculate Feedback
            const newGrid = [...grid];
            const targetArr = targetWord.split('');
            const guessArr = guess.split('');
            const statusArr = Array(5).fill('absent');

            // Pass 1: Correct
            for (let i = 0; i < 5; i++) {
                if (guessArr[i] === targetArr[i]) {
                    statusArr[i] = 'correct';
                    targetArr[i] = null; // Mark used
                    guessArr[i] = null;
                }
            }

            // Pass 2: Present
            for (let i = 0; i < 5; i++) {
                if (guessArr[i] !== null) { // Not matched yet
                    const idx = targetArr.indexOf(guessArr[i]);
                    if (idx !== -1) {
                        statusArr[i] = 'present';
                        targetArr[idx] = null; // Mark used
                    }
                }
            }

            // Update Grid
            rowData.forEach((cell, i) => {
                newGrid[currentRow][i] = { ...cell, status: statusArr[i] };
            });
            setGrid(newGrid);

            // Win/Loss Check
            if (guess === targetWord) {
                setGameState('won');
            } else if (currentRow === 5) {
                setGameState('lost');
            } else {
                setCurrentRow(prev => prev + 1);
            }
            
            // Update Solver even in Play Mode
            
        } else {
            // Helper Mode: Just advance
            if (currentRow < 5) {
                setCurrentRow(prev => prev + 1);
            }
        }
    };
    
    // Unified Solver Effect
    useEffect(() => {
        let newCandidates = [...WORDS];
        
        grid.forEach((row, idx) => {
            // Only consider rows that are fully filled
            if (row.every(c => c.char) && row.some(c => c.status !== 'absent' || mode === 'helper')) { 
                 if (mode === 'play' && idx >= currentRow) return;
                 
                 const feedback = row.map(c => c.status);
                 const word = row.map(c => c.char).join('');
                 if (word.length === 5) {
                    newCandidates = filterWords(newCandidates, word, feedback);
                 }
            }
        });
        
        const sortedCandidates = sortCandidates(newCandidates);
        setCandidates(sortedCandidates);
        setBestGuess(getBestGuess(sortedCandidates));

    }, [grid, currentRow, mode]); // Added currentRow dependency


    // Fill current row with word
    const fillRow = (word) => {
        if (currentRow >= 6 || gameState !== 'playing') return;
        const newGrid = [...grid];
        const row = newGrid[currentRow];
        word.split('').forEach((char, i) => {
            row[i] = { ...row[i], char, status: 'absent' };
        });
        setGrid(newGrid);
    };

    // Reset
    const handleReset = () => {
        setGrid(Array(6).fill(null).map(() => Array(5).fill({ char: '', status: 'absent' })));
        setCurrentRow(0);
        setCandidates(WORDS);
        setBestGuess({ likely: null, eliminator: null });
        setGameState('playing');
        if (mode === 'play') startNewGame();
    };


    const handleKeyDown = (e, row, col) => {
        if (row !== currentRow) return;
        
        if (e.key === 'Enter') {
            handleEnter();
        } else if (e.key === 'Backspace' && !grid[row][col].char && col > 0) {
            e.preventDefault();
            const prevInput = document.getElementById(`cell-${row}-${col - 1}`);
            if (prevInput) {
                prevInput.focus();
            }
        }
    };

    const StatusColors = {
        absent: 'bg-slate-700 text-white border-slate-600',
        present: 'bg-yellow-500 text-white border-yellow-500',
        correct: 'bg-green-500 text-white border-green-500'
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-[#0B0C15] font-sans overflow-x-hidden text-slate-300 overflow-y-auto lg:overflow-hidden">
             {gameState === 'won' && <Confetti />}
             
            {/* Background Ambience */}
             <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-30">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-green-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-yellow-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Main Content (Left) */}
            <div className="flex-1 flex flex-col relative z-10 p-4 lg:p-6 items-center justify-start lg:justify-center min-h-[50vh]">
                
                 {/* Header Overlay */}
                 <div className="absolute top-4 left-4 lg:top-6 lg:left-6 z-20 flex gap-2 lg:gap-4 flex-wrap">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all w-fit"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    
                    {/* Mode Toggle */}
                    <div className="bg-slate-800/80 p-1 rounded-full border border-white/10 flex">
                        <button 
                            onClick={() => setMode('helper')}
                            className={`px-3 lg:px-4 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all ${mode === 'helper' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Helper
                        </button>
                        <button 
                            onClick={() => setMode('play')}
                            className={`px-3 lg:px-4 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all ${mode === 'play' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Play Wordle
                        </button>
                    </div>
                </div>

                <div className="max-w-md w-full">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400 mb-2">
                            {mode === 'play' ? 'Play Wordle' : 'Wordle Helper'}
                        </h1>
                        <p className="text-slate-500 text-xs lg:text-sm">
                            {mode === 'play' ? 'Guess the hidden word!' : 'Type guess, tap tile to change color'}
                        </p>
                        {gameState === 'won' && <div className="mt-2 text-green-400 font-bold text-xl animate-bounce">Review: Impressive! 🎉</div>}
                        {gameState === 'lost' && <div className="mt-2 text-red-400 font-bold text-xl">Word was: {targetWord} 😢</div>}
                    </div>

                    {/* Grid */}
                    <div className="flex flex-col gap-2">
                        {grid.map((row, rowIndex) => (
                            <div key={rowIndex} className={`flex gap-2 justify-center ${rowIndex > currentRow && gameState === 'playing' ? 'opacity-30' : ''}`}>
                                {row.map((cell, colIndex) => (

    // ... inside render map ...
                                    <input
                                        key={colIndex}
                                        id={`cell-${rowIndex}-${colIndex}`}
                                        type="text"
                                        maxLength={1}
                                        value={cell.char}
                                        onChange={(e) => handleInput(rowIndex, colIndex, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                                        onClick={() => toggleStatus(rowIndex, colIndex)}
                                        disabled={rowIndex !== currentRow || gameState !== 'playing'} 
                                        className={`w-12 h-12 lg:w-14 lg:h-14 text-2xl lg:text-3xl font-bold text-center uppercase rounded-lg border-2 outline-none transition-all cursor-pointer select-none
                                            ${StatusColors[cell.status]} ${rowIndex === currentRow && gameState === 'playing' ? 'focus:border-white' : 'border-transparent'}
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
                            disabled={currentRow >= 5 && gameState === 'playing'} // Allow if won/lost? No.
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                        >
                            {mode === 'play' ? 'Submit Guess' : 'Next Row'}
                        </button>
                    </div>

                </div>
            </div>

            {/* Sidebar (Right) */}
            <div className="w-full lg:w-80 h-auto lg:h-full bg-slate-900/80 backdrop-blur-xl border-t lg:border-l border-white/10 p-6 flex flex-col shadow-2xl z-20 overflow-hidden lg:static relative">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-2">
                    {mode === 'play' ? 'Hints & Analysis' : 'Analysis'}
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
