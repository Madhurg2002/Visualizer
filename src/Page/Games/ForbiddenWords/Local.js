
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Check, X, SkipForward, Timer, Trophy, ArrowLeft } from 'lucide-react';
import { forbiddenWordsCards } from './data';
export default function LocalForbiddenWords({ onBack }) {
    const [gameState, setGameState] = useState('start'); // start, playing, end
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [shuffledCards, setShuffledCards] = useState([]);

    // Initialize game
    useEffect(() => {
        setShuffledCards([...forbiddenWordsCards].sort(() => Math.random() - 0.5));
    }, []);

    // Timer logic
    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setGameState('end');
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(60);
        setGameState('playing');
        setShuffledCards([...forbiddenWordsCards].sort(() => Math.random() - 0.5));
        setCurrentCardIndex(0);
    };

    const handleCorrect = () => {
        setScore((prev) => prev + 1);
        nextCard();
    };

    const handleSkip = () => {
        nextCard();
    };

    const handleForbidden = () => {
        setScore((prev) => Math.max(0, prev - 1)); // Optional penalty
        nextCard();
    };

    const nextCard = () => {
        if (currentCardIndex < shuffledCards.length - 1) {
            setCurrentCardIndex((prev) => prev + 1);
        } else {
            setGameState('end'); // End game if run out of cards
        }
    };

    const currentCard = shuffledCards[currentCardIndex];

    return (
        <div className="w-full flex flex-col items-center justify-start p-4 relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-8 text-center drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] z-10">
                Forbidden Words <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Local</span>
            </h1>
            <div className="absolute top-24 left-0 right-0 w-full z-40 pointer-events-none px-4">
                <div className="max-w-7xl mx-auto px-6">
                    <button
                        onClick={onBack}
                        className="pointer-events-auto px-4 py-2 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <ArrowLeft size={16} />
                        <span className="font-bold text-sm">Exit</span>
                    </button>
                </div>
            </div>

            <div className="max-w-md w-full z-10">
                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
                        >
                            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6">
                                Taboo
                            </h1>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Get your team to guess the word at the top without saying any of the forbidden words below!
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8 text-left bg-white/5 p-4 rounded-2xl">
                                <div className="flex items-center gap-2 text-green-400">
                                    <Check size={20} />
                                    <span>+1 Point</span>
                                </div>
                                <div className="text-slate-500 text-sm">Correct Guess</div>

                                <div className="flex items-center gap-2 text-yellow-400">
                                    <SkipForward size={20} />
                                    <span>0 Points</span>
                                </div>
                                <div className="text-slate-500 text-sm">Skip Card</div>

                                <div className="flex items-center gap-2 text-red-400">
                                    <X size={20} />
                                    <span>-1 Point</span>
                                </div>
                                <div className="text-slate-500 text-sm">Taboo Word</div>
                            </div>

                            <button
                                onClick={startGame}
                                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Play size={24} fill="currentColor" />
                                Start Game
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && currentCard && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="w-full"
                        >
                            {/* HUD */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 px-4 py-2 rounded-full border border-white/10">
                                    <Timer size={20} className="text-blue-400" />
                                    <span className="font-mono text-xl font-bold">{timeLeft}s</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 px-4 py-2 rounded-full border border-white/10">
                                    <Trophy size={20} className="text-yellow-400" />
                                    <span className="font-mono text-xl font-bold">{score}</span>
                                </div>
                            </div>

                            {/* Card */}
                            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-[1.02] mb-8 relative">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-center">
                                    <h2 className="text-4xl font-black text-white uppercase tracking-wider drop-shadow-md">
                                        {currentCard.word}
                                    </h2>
                                </div>

                                {/* Forbidden Words */}
                                <div className="p-8 bg-white flex flex-col items-center gap-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                        Forbidden Words
                                    </div>
                                    {currentCard.forbidden.map((word, idx) => (
                                        <div key={idx} className="text-xl font-bold text-slate-700 py-1 border-b border-slate-100 last:border-0 w-full text-center">
                                            {word}
                                        </div>
                                    ))}
                                </div>

                                {/* Decoration */}
                                <div className="h-2 bg-gradient-to-r from-pink-500 to-purple-600"></div>
                            </div>

                            {/* Controls */}
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={handleForbidden}
                                    className="flex flex-col items-center justify-center gap-1 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all active:scale-95"
                                >
                                    <X size={32} />
                                    <span className="text-sm font-bold">Forbidden</span>
                                </button>

                                <button
                                    onClick={handleSkip}
                                    className="flex flex-col items-center justify-center gap-1 p-4 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/20 transition-all active:scale-95"
                                >
                                    <SkipForward size={32} />
                                    <span className="text-sm font-bold">Skip</span>
                                </button>

                                <button
                                    onClick={handleCorrect}
                                    className="flex flex-col items-center justify-center gap-1 p-4 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-2xl border border-green-500/20 transition-all active:scale-95"
                                >
                                    <Check size={32} />
                                    <span className="text-sm font-bold">Correct</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'end' && (
                        <motion.div
                            key="end"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
                        >
                            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-400">
                                <Trophy size={40} />
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-2">Time's Up!</h2>
                            <p className="text-slate-400 mb-8">You managed to get</p>

                            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">
                                {score}
                            </div>

                            <button
                                onClick={startGame}
                                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={24} />
                                Play Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};