import React, { useState, useEffect, useRef, useCallback } from 'react';

const GAME_HEIGHT = 600;
const GAME_WIDTH = 400; // Constrained width for mobile-like feel
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 52;
const PIPE_GAP = 160;
const BIRD_SIZE = 34;

export default function FlappyBird() {
    const [gameState, setGameState] = useState('START'); // START, PLAYING, GAME_OVER, COUNTDOWN
    const [score, setScore] = useState(0);
    const [displayPipes, setDisplayPipes] = useState([]);
    const [displayBirdY, setDisplayBirdY] = useState(GAME_HEIGHT / 2);
    const [displayBirdRot, setDisplayBirdRot] = useState(0);

    const [countdown, setCountdown] = useState(3);
    const [useCountdown, setUseCountdown] = useState(true);
    const [canRestart, setCanRestart] = useState(true);
    const [highScore, setHighScore] = useState(() => {
        return parseInt(localStorage.getItem('flappyHighScore') || '0', 10);
    });

    // Game Loop Refs (Source of Truth)
    const birdY = useRef(GAME_HEIGHT / 2);
    const birdVel = useRef(0);
    const pipes = useRef([]);
    const requestRef = useRef();
    const scoreRef = useRef(0);

    const spawnPipe = (xOffset) => {
        const minTop = 50;
        const maxTop = GAME_HEIGHT - 150 - PIPE_GAP;
        const topHeight = Math.random() * (maxTop - minTop) + minTop;
        return { x: xOffset, topHeight, passed: false };
    };

    // Forward declaration for mutual recursion with gameLoop
    const gameOverRef = useRef(null);

    const gameLoop = useCallback(() => {
        // 1. Update Physics
        birdVel.current += GRAVITY;
        birdY.current += birdVel.current;

        // 2. Move Pipes & Spawn
        pipes.current.forEach(pipe => {
            pipe.x -= PIPE_SPEED;
        });

        // Remove off-screen pipes
        if (pipes.current.length > 0 && pipes.current[0].x + PIPE_WIDTH < 0) {
            pipes.current.shift();
        }

        // Spawn new pipes
        const lastPipe = pipes.current[pipes.current.length - 1];
        if (lastPipe && GAME_WIDTH - lastPipe.x > 220) { // Distance between pipes
            pipes.current.push(spawnPipe(GAME_WIDTH));
        }

        // 3. Collision Detection
        const birdRect = {
            top: birdY.current,
            bottom: birdY.current + BIRD_SIZE,
            left: 50,
            right: 50 + BIRD_SIZE
        };

        // Floor/Ceiling
        if (birdRect.top < 0 || birdRect.bottom > GAME_HEIGHT) {
            gameOverRef.current();
            return;
        }

        // Pipes
        for (let pipe of pipes.current) {
            // Horizontal overlap
            if (birdRect.right > pipe.x && birdRect.left < pipe.x + PIPE_WIDTH) {
                // Vertical check (hit top pipe or bottom pipe)
                if (birdRect.top < pipe.topHeight || birdRect.bottom > pipe.topHeight + PIPE_GAP) {
                    gameOverRef.current();
                    return;
                }
            }

            // Score
            if (!pipe.passed && birdRect.left > pipe.x + PIPE_WIDTH) {
                pipe.passed = true;
                scoreRef.current += 1;
                setScore(scoreRef.current);
            }
        }

        // 4. Update Render State
        setDisplayBirdY(birdY.current);
        setDisplayPipes([...pipes.current]);
        setDisplayBirdRot(Math.min(Math.max(birdVel.current * 4, -25), 90));

        requestRef.current = requestAnimationFrame(gameLoop);
    }, []); // Dependencies are empty because it uses refs and setters, which are stable

    const gameOver = useCallback(() => {
        setGameState('GAME_OVER');
        setCanRestart(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem('flappyHighScore', scoreRef.current.toString());
        }

        // 1 Second Cooldown
        setTimeout(() => {
            setCanRestart(true);
        }, 1000);
    }, [highScore]);

    // Assign gameOver to ref after it's defined
    useEffect(() => {
        gameOverRef.current = gameOver;
    }, [gameOver]);

    const startGame = useCallback(() => {
        setGameState('PLAYING');
        setScore(0);
        setCanRestart(false); // Reset cooldown flag for next time
        scoreRef.current = 0;

        birdY.current = GAME_HEIGHT / 2;
        birdVel.current = 0;
        pipes.current = [spawnPipe(GAME_WIDTH + 100)]; // Start with one pipe ahead

        // Reset display state immediately to prevent visual artifacts
        setDisplayBirdY(GAME_HEIGHT / 2);
        setDisplayBirdRot(0);
        setDisplayPipes([]);

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [gameLoop]); // gameLoop is a dependency because it's called directly

    const triggerStart = useCallback(() => {
        if (gameState === 'COUNTDOWN') return;

        // Reset game state immediately for visual feedback during countdown
        birdY.current = GAME_HEIGHT / 2;
        birdVel.current = 0;
        pipes.current = [spawnPipe(GAME_WIDTH + 100)];
        scoreRef.current = 0;

        setDisplayBirdY(GAME_HEIGHT / 2);
        setDisplayBirdRot(0);
        setDisplayPipes([]);
        setScore(0);

        if (useCountdown) {
            setGameState('COUNTDOWN');
            setCountdown(3);
        } else {
            startGame();
        }
    }, [gameState, useCountdown, startGame]);

    // ...

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

    const jump = useCallback(() => {
        if (gameState === 'PLAYING') {
            birdVel.current = JUMP_STRENGTH;
        } else if (gameState === 'START') {
            triggerStart();
        } else if (gameState === 'GAME_OVER') {
            if (canRestart) triggerStart();
        }
    }, [gameState, canRestart, triggerStart]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                jump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [jump]);



    // Cleanup
    useEffect(() => {
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 font-sans p-4"
            onMouseDown={(e) => { e.preventDefault(); jump(); }}
            onTouchStart={(e) => { e.preventDefault(); jump(); }}
        >
            <h1 className="text-4xl font-bold text-white mb-6 text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 drop-shadow-lg">
                Flappy Bird
            </h1>

            <div className="relative overflow-hidden bg-sky-300 shadow-2xl border-4 border-slate-700 rounded-lg cursor-pointer max-w-full"
                style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>

                {/* Background Clouds (Static for now, could animate) */}
                <div className="absolute top-20 left-10 text-white/50 text-6xl">☁️</div>
                <div className="absolute top-40 right-20 text-white/40 text-5xl">☁️</div>

                {/* Bird */}
                <div className="absolute bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center"
                    style={{
                        left: 50,
                        top: displayBirdY,
                        width: BIRD_SIZE,
                        height: BIRD_SIZE,
                        transform: `rotate(${displayBirdRot}deg)`,
                        zIndex: 20
                    }}
                >
                    <div className="absolute right-1 top-2 w-3 h-3 bg-white rounded-full border border-black">
                        <div className="absolute right-0.5 top-1 w-1 h-1 bg-black rounded-full"></div>
                    </div>
                    <div className="absolute -right-2 top-4 w-4 h-3 bg-orange-500 rounded-full border border-black"></div>
                    <div className="absolute bg-white/40 w-full h-1/2 top-0 rounded-t-full"></div>
                </div>

                {/* Pipes */}
                {displayPipes.map((pipe, i) => (
                    <React.Fragment key={i}>
                        {/* Top Pipe */}
                        <div className="absolute bg-green-500 border-x-4 border-b-4 border-black"
                            style={{
                                left: pipe.x,
                                top: 0,
                                width: PIPE_WIDTH,
                                height: pipe.topHeight,
                                zIndex: 10
                            }}
                        >
                            <div className="absolute bottom-0 w-[110%] -left-[5%] h-6 bg-green-500 border-4 border-black"></div>
                        </div>

                        {/* Bottom Pipe */}
                        <div className="absolute bg-green-500 border-x-4 border-t-4 border-black"
                            style={{
                                left: pipe.x,
                                top: pipe.topHeight + PIPE_GAP,
                                width: PIPE_WIDTH,
                                height: GAME_HEIGHT - (pipe.topHeight + PIPE_GAP),
                                zIndex: 10
                            }}
                        >
                            <div className="absolute top-0 w-[110%] -left-[5%] h-6 bg-green-500 border-4 border-black"></div>
                        </div>
                    </React.Fragment>
                ))}

                {/* Ground */}
                <div className="absolute bottom-0 w-full h-4 bg-yellow-700 border-t-4 border-black z-30">
                    <div className="w-full h-full bg-grid-pattern opacity-20"></div>
                </div>

                {/* UI: Score */}
                {(gameState === 'PLAYING' || gameState === 'GAME_OVER') && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 text-5xl font-extrabold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] stroke-black text-stroke-2">
                        {score}
                    </div>
                )}

                {/* UI: Countdown */}
                {gameState === 'COUNTDOWN' && (
                    <div className="absolute inset-0 flex items-center justify-center z-50">
                        <div className="text-8xl font-black text-white animate-ping drop-shadow-xl stroke-black text-stroke-2">
                            {countdown === 0 ? 'GO!' : countdown}
                        </div>
                    </div>
                )}

                {/* UI: Start Screen */}
                {gameState === 'START' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-50 backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl text-center shadow-2xl border border-white/10 transform transition-transform hover:scale-105 cursor-default max-w-xs w-full">
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">GET READY</h2>
                            <p className="text-slate-400 font-medium mb-6">Tap or Space to Jump</p>

                            <button
                                onClick={(e) => { e.stopPropagation(); triggerStart(); }}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-green-500/25 transition-all active:scale-95 mb-6"
                            >
                                START GAME
                            </button>

                            <label className="flex items-center justify-center gap-3 text-sm font-medium text-slate-400 cursor-pointer select-none group">
                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${useCountdown ? 'bg-blue-500 border-blue-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
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

                {/* UI: Game Over */}
                {gameState === 'GAME_OVER' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
                        <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl text-center shadow-2xl border border-white/10 animate-bounce-in cursor-default max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
                            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-rose-600 mb-6 drop-shadow-sm">GAME OVER</p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Score</p>
                                    <p className="text-3xl font-black text-white">{score}</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Best</p>
                                    <p className="text-3xl font-black text-yellow-400">{highScore}</p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); if (canRestart) triggerStart(); }}
                                disabled={!canRestart}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${canRestart
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
                                    : "bg-slate-700 text-slate-500 cursor-not-allowed opacity-50"
                                    }`}
                            >
                                {canRestart ? "PLAY AGAIN" : "WAIT..."}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <p className="mt-6 text-slate-400 font-medium select-none text-sm">
                Controls: Spacebar or Tap
            </p>
        </div>
    );
}
