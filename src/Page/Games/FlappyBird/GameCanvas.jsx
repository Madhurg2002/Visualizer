import React, { useRef, useEffect, useState } from 'react';

const GAME_HEIGHT = 600;
const GAME_WIDTH = 400;
const GRAVITY = 0.25;
const JUMP_STRENGTH = -6;
const PIPE_SPEED = 3; // Slightly faster for canvas smoothness
const PIPE_WIDTH = 52;
const PIPE_GAP = 160;
const BIRD_SIZE = 34;

const GameCanvas = ({ gameState, onScore, onGameOver, triggerJump }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    
    // Game State (Mutable for performance loop)
    const state = useRef({
        birdY: GAME_HEIGHT / 2,
        birdVel: 0,
        pipes: [],
        score: 0,
        frames: 0
    });

    // Assets
    const birdImg = useRef(new Image());
    useEffect(() => {
        birdImg.current.src = "/images/robot_bird.png";
    }, []);

    const spawnPipe = (xOffset) => {
        const minTop = 50;
        const maxTop = GAME_HEIGHT - 150 - PIPE_GAP;
        const topHeight = Math.random() * (maxTop - minTop) + minTop;
        const variant = Math.random() > 0.5 ? 'purple' : 'blue';
        return { x: xOffset, topHeight, passed: false, variant };
    };

    // Reset logic
    useEffect(() => {
        if (gameState === 'START' || gameState === 'COUNTDOWN') {
            state.current = {
                birdY: GAME_HEIGHT / 2,
                birdVel: 0,
                pipes: [spawnPipe(GAME_WIDTH + 100)],
                score: 0,
                frames: 0
            };
        }
    }, [gameState]);

    // Input Handling (Jump)
    useEffect(() => {
        if (triggerJump && gameState === 'PLAYING') {
            state.current.birdVel = JUMP_STRENGTH;
        }
    }, [triggerJump, gameState]);

    const draw = (ctx) => {
        // Clear
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // 1. Draw Background (Gradient)
        // We can do this in CSS for the container, but drawing here allows potential parallax
        // For now, let's assume background is CSS to save performance/complexity, 
        // OR draw specific elements.
        
        // Draw Grid Overlay (scrolling)
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
        ctx.lineWidth = 1;
        const gridOffset = (state.current.frames * PIPE_SPEED * 0.5) % 40;
        ctx.beginPath();
        for (let x = -gridOffset; x < GAME_WIDTH; x += 40) {
            ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT);
        }
        ctx.stroke();

        // 2. Draw Pipes
        state.current.pipes.forEach(pipe => {
            // Gradient Logic
            const isPurple = pipe.variant === 'purple';
            const colorTop = isPurple ? '#6b21a8' : '#155e75'; // purple-800 : cyan-800
            const colorBot = isPurple ? '#a855f7' : '#06b6d4'; // purple-500 : cyan-500

            // Top Pipe
            const gradTop = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
            gradTop.addColorStop(0, colorTop);
            gradTop.addColorStop(1, colorBot);

            ctx.fillStyle = gradTop;
            // Shadow (Glow)
            ctx.shadowColor = isPurple ? 'rgba(168,85,247,0.5)' : 'rgba(6,182,212,0.5)';
            ctx.shadowBlur = 15;
            
            // Draw Pipe Body
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            
            // Cap
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(pipe.x, pipe.topHeight - 20, PIPE_WIDTH, 20);

            // Bottom Pipe
            ctx.fillStyle = gradTop; 
            ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - (pipe.topHeight + PIPE_GAP));
            
            // Cap
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, 20);

            ctx.shadowBlur = 0; // Reset
            
            // Gap Glow
            // ctx.fillStyle = 'rgba(255,255,255,0.05)';
            // ctx.fillRect(pipe.x, pipe.topHeight, PIPE_WIDTH, PIPE_GAP);
        });

        // 3. Draw Ground
        // ctx.fillStyle = '#020617'; // slate-950
        // ctx.fillRect(0, GAME_HEIGHT - 10, GAME_WIDTH, 10);


        // 4. Draw Bird
        const { birdY: y, birdVel: vy } = state.current;
        const rotation = Math.min(Math.max(vy * 0.15, -0.5), 0.5); // Radians

        ctx.save();
        ctx.translate(50 + BIRD_SIZE/2, y + BIRD_SIZE/2);
        ctx.rotate(rotation);
        
        ctx.shadowColor = 'rgba(255,215,0,0.6)';
        ctx.shadowBlur = 10;

        if (birdImg.current.complete && birdImg.current.naturalHeight !== 0) {
            ctx.drawImage(birdImg.current, -BIRD_SIZE/2, -BIRD_SIZE/2, BIRD_SIZE, BIRD_SIZE);
        } else {
            // Fallback: Glowing Ball
            ctx.beginPath();
            ctx.arc(0, 0, BIRD_SIZE/2 - 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.fill();
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    };

    const update = () => {
        if (gameState !== 'PLAYING') return;

        state.current.frames++;

        // Physics
        state.current.birdVel += GRAVITY;
        state.current.birdY += state.current.birdVel;

        // Collision Check (Floor/Ceiling)
        if (state.current.birdY < 0 || state.current.birdY + BIRD_SIZE > GAME_HEIGHT) {
            onGameOver(state.current.score);
            return;
        }

        // Pipe Logic
        const pipes = state.current.pipes;
        
        // Move
        pipes.forEach(pipe => pipe.x -= PIPE_SPEED);

        // Spawn
        const lastPipe = pipes[pipes.length - 1];
        if (lastPipe && GAME_WIDTH - lastPipe.x > 220) {
            pipes.push(spawnPipe(GAME_WIDTH));
        }

        // Remove off-screen
        if (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < -50) {
            state.current.pipes.shift();
        }

        // Collision Check (Pipes)
        const birdLeft = 54; // 50 + padding
        const birdRight = 50 + BIRD_SIZE - 4;
        const birdTop = state.current.birdY + 4;
        const birdBottom = state.current.birdY + BIRD_SIZE - 4;

        for (let pipe of pipes) {
            if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
                if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
                    onGameOver(state.current.score);
                    return;
                }
            }

            if (!pipe.passed && birdLeft > pipe.x + PIPE_WIDTH) {
                pipe.passed = true;
                state.current.score += 1;
                onScore(state.current.score);
            }
        }
    };

    // Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        let animationId;
        
        const loop = () => {
            update();
            // Always draw, even if not playing (to show initial state or game over state)
            // But we need to sync state for Start screen?
            // Actually, if we are START, we just draw the initial state.
            draw(ctx); 
            animationId = requestAnimationFrame(loop);
        };

        animationId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationId);
    }, [gameState, onGameOver, onScore]);

    return (
        <canvas 
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="rounded-xl shadow-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm"
            style={{ 
                touchAction: 'none'
            }}
        />
    );
};

export default GameCanvas;
