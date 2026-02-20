import React, { useState, useEffect, useCallback } from 'react';
import { Title, RefreshCw, Play, Trophy, Pause } from 'lucide-react';
import GameCanvas from './GameCanvas';

// Constants shared with Canvas for UI sizing if needed, or just hardcode
const GAME_HEIGHT = 600;
const GAME_WIDTH = 400;

export default function FlappyBird() {
    const [gameState, setGameState] = useState('START'); // START, PLAYING, GAME_OVER, COUNTDOWN
    const [score, setScore] = useState(0);
    const [triggerJump, setTriggerJump] = useState(0); // Counter to trigger effects

    const [countdown, setCountdown] = useState(3);
    const [useCountdown, setUseCountdown] = useState(true);
    const [canRestart, setCanRestart] = useState(true);
    const [highScore, setHighScore] = useState(() => {
        return parseInt(localStorage.getItem('flappyHighScore') || '0', 10);
    });

    // Score Handler (called from Canvas)
    const handleScore = useCallback((newScore) => {
        setScore(newScore);
    }, []);

    // Game Over Handler (called from Canvas)
    const handleGameOver = useCallback((finalScore) => {
        setGameState('GAME_OVER');
        setCanRestart(false);

        if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('flappyHighScore', finalScore.toString());
        }

        setTimeout(() => setCanRestart(true), 1000);
    }, [highScore]);

    // Start Sequence
    const startGame = useCallback(() => {
        setGameState('PLAYING');
        setScore(0);
        setCanRestart(false);
    }, []);

    const triggerStart = useCallback(() => {
        if (gameState === 'COUNTDOWN') return;

        if (useCountdown) {
            setGameState('COUNTDOWN');
            setCountdown(3);
        } else {
            startGame();
        }
    }, [gameState, useCountdown, startGame]);

    // Countdown Timer
    useEffect(() => {
        if (gameState === 'COUNTDOWN') {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                startGame();
            }
        }
    }, [gameState, countdown, startGame]);

    // Controls
    const jump = useCallback(() => {
        if (gameState === 'PLAYING') {
            setTriggerJump(prev => prev + 1);
        } else if (gameState === 'START') {
            triggerStart();
        } else if (gameState === 'GAME_OVER' && canRestart) {
            triggerStart();
        }
    }, [gameState, canRestart, triggerStart]);

    const togglePause = useCallback(() => {
        if (gameState === 'PLAYING') setGameState('PAUSED');
        else if (gameState === 'PAUSED') setGameState('PLAYING');
    }, [gameState]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                jump();
            } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                e.preventDefault();
                togglePause();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [jump, togglePause]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0C15] font-sans p-4 select-none"
            onMouseDown={(e) => { e.preventDefault(); jump(); }}
            onTouchStart={(e) => { e.preventDefault(); jump(); }}
        >
            <h1 className="text-4xl font-black text-white mb-6 text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-600 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                Flappy CyberBird
            </h1>

            <div className="relative shadow-2xl rounded-2xl cursor-pointer" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
                
                {/* Canvas Layer */}
                <div className="absolute inset-0 z-0">
                    <GameCanvas 
                        gameState={gameState}
                        onScore={handleScore}
                        onGameOver={handleGameOver}
                        triggerJump={triggerJump}
                    />
                </div>

                {/* UI Overlay Layer */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Score */}
                    {(gameState === 'PLAYING' || gameState === 'GAME_OVER' || gameState === 'PAUSED') && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-6xl font-black text-white/10 drop-shadow-sm pointer-events-none">
                            {score}
                        </div>
                    )}
                    {(gameState === 'PLAYING' || gameState === 'GAME_OVER' || gameState === 'PAUSED') && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 opacity-80 pointer-events-none">
                            {score}
                        </div>
                    )}

                    {/* Pause Button */}
                    {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); togglePause(); }}
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer pointer-events-auto backdrop-blur-md border border-white/20 transition-colors z-50 text-white"
                            title="Pause/Resume (P)"
                        >
                            {gameState === 'PLAYING' ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                    )}

                    {/* Paused Screen */}
                    {gameState === 'PAUSED' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto z-40">
                            <div className="text-5xl font-black text-white tracking-widest drop-shadow-lg mb-6">PAUSED</div>
                            <button
                                onClick={(e) => { e.stopPropagation(); togglePause(); }}
                                className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl text-white font-bold tracking-wider transition-all border border-white/20 shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Play fill="white" size={20} /> RESUME
                            </button>
                        </div>
                    )}

                    {/* Countdown */}
                    {gameState === 'COUNTDOWN' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 animate-ping drop-shadow-lg">
                                {countdown === 0 ? 'GO!' : countdown}
                            </div>
                        </div>
                    )}

                    {/* Start Screen */}
                    {gameState === 'START' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
                            <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl text-center shadow-2xl border border-white/10 transform transition-transform hover:scale-105 cursor-default max-w-xs w-full">
                                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">READY?</h2>
                                <p className="text-slate-400 font-medium mb-8">Tap or Space to Jump</p>

                                <button
                                    onClick={(e) => { e.stopPropagation(); triggerStart(); }}
                                    className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all active:scale-95 mb-6 flex items-center justify-center gap-2"
                                >
                                    <Play size={20} fill="white" /> START
                                </button>

                                <label className="flex items-center justify-center gap-3 text-sm font-medium text-slate-400 cursor-pointer select-none group">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${useCountdown ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                                        {useCountdown && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={useCountdown}
                                        onChange={(e) => setUseCountdown(e.target.checked)}
                                        className="hidden"
                                    />
                                    Enable Countdown
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Game Over Screen */}
                    {gameState === 'GAME_OVER' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
                            <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl text-center shadow-2xl border border-white/10 animate-bounce-in cursor-default max-w-xs w-full">
                                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-rose-600 mb-6 drop-shadow-sm">CRASHED</p>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Score</p>
                                        <p className="text-3xl font-black text-white">{score}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">Best</p>
                                        <p className="text-3xl font-black text-yellow-400">{highScore}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); if (canRestart) triggerStart(); }}
                                    disabled={!canRestart}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${canRestart
                                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] active:scale-95"
                                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                                        }`}
                                >
                                    <RefreshCw size={20} className={!canRestart ? "animate-spin" : ""} /> {canRestart ? "RETRY" : "REBOOTING..."}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <p className="mt-6 text-slate-500 font-mono font-medium select-none text-xs tracking-widest uppercase">
                [SPACE] TO JUMP
            </p>
        </div>
    );
}
