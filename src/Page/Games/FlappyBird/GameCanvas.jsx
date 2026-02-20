import React, { useRef, useEffect, useState } from 'react';

const GAME_HEIGHT = 600;
const GAME_WIDTH = 400;
const GRAVITY = 0.25;
const JUMP_STRENGTH = -6;
const PIPE_SPEED = 3; 
const PIPE_WIDTH = 52;
const PIPE_GAP = 160;
const BIRD_SIZE = 34;

const GameCanvas = ({ gameState, onScore, onGameOver, triggerJump }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    
    const state = useRef({
        birdY: GAME_HEIGHT / 2,
        birdVel: 0,
        pipes: [],
        particles: [],
        stars: [],
        score: 0,
        frames: 0
    });

    const birdImg = useRef(new Image());
    useEffect(() => {
        birdImg.current.src = "/images/robot_bird.png";
        // Initialize stars once
        const initialStars = [];
        for(let i = 0; i < 50; i++) {
            initialStars.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.1,
                color: Math.random() > 0.5 ? '#fff' : '#c084fc'
            });
        }
        state.current.stars = initialStars;
    }, []);

    const spawnPipe = (xOffset) => {
        const minTop = 50;
        const maxTop = GAME_HEIGHT - 150 - PIPE_GAP;
        const topHeight = Math.random() * (maxTop - minTop) + minTop;
        const variant = Math.random() > 0.5 ? 'purple' : 'cyan';
        return { x: xOffset, topHeight, passed: false, variant };
    };

    const spawnParticles = (x, y, type) => {
        const count = type === 'JUMP' ? 8 : type === 'CRASH' ? 30 : 1;
        for (let i = 0; i < count; i++) {
            state.current.particles.push({
                x,
                y,
                vx: type === 'CRASH' ? (Math.random() - 0.5) * 10 : (Math.random() - 0.5) * 4 - 2,
                vy: type === 'CRASH' ? (Math.random() - 0.5) * 10 : Math.random() * 2,
                life: type === 'CRASH' ? 40 : 20,
                maxLife: type === 'CRASH' ? 40 : 20,
                color: type === 'CRASH' ? '#ef4444' : '#2dd4bf',
                size: Math.random() * 4 + 2
            });
        }
    };

    useEffect(() => {
        if (gameState === 'START' || gameState === 'COUNTDOWN') {
            state.current = {
                ...state.current,
                birdY: GAME_HEIGHT / 2,
                birdVel: 0,
                pipes: [spawnPipe(GAME_WIDTH + 100)],
                particles: [],
                score: 0,
                frames: 0
            };
        }
    }, [gameState]);

    useEffect(() => {
        if (triggerJump && gameState === 'PLAYING') {
            state.current.birdVel = JUMP_STRENGTH;
            spawnParticles(50 + BIRD_SIZE/2, state.current.birdY + BIRD_SIZE, 'JUMP');
        }
    }, [triggerJump, gameState]);

    const draw = (ctx) => {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        bgGrad.addColorStop(0, '#020617'); // slate-950
        bgGrad.addColorStop(1, '#0f172a'); // slate-900
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw Parallax Stars
        state.current.stars.forEach(star => {
            ctx.fillStyle = star.color;
            ctx.globalAlpha = Math.max(0.2, Math.sin(state.current.frames * 0.05 + star.x) * 0.5 + 0.5);
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });

        // Draw Grid
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
        ctx.lineWidth = 1;
        const gridOffset = (state.current.frames * PIPE_SPEED * 0.5) % 40;
        ctx.beginPath();
        for (let x = -gridOffset; x < GAME_WIDTH; x += 40) {
            ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT);
        }
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            ctx.moveTo(0, y); ctx.lineTo(GAME_WIDTH, y);
        }
        ctx.stroke();

        // Draw Pipes
        state.current.pipes.forEach(pipe => {
            const isPurple = pipe.variant === 'purple';
            const colorTop = isPurple ? '#581c87' : '#164e63'; // darker body
            const colorBot = isPurple ? '#d8b4fe' : '#67e8f9'; // bright edge
            const neonGlow = isPurple ? '#a855f7' : '#06b6d4';

            ctx.shadowColor = neonGlow;
            ctx.shadowBlur = 10;
            
            // Top Pipe
            const gradTop = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
            gradTop.addColorStop(0, colorTop);
            gradTop.addColorStop(0.5, colorBot);
            gradTop.addColorStop(1, colorTop);
            ctx.fillStyle = gradTop;
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            
            // Top Cap
            ctx.fillStyle = neonGlow;
            ctx.fillRect(pipe.x - 4, pipe.topHeight - 16, PIPE_WIDTH + 8, 16);

            // Bottom Pipe
            ctx.fillStyle = gradTop; 
            ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - (pipe.topHeight + PIPE_GAP));
            
            // Bottom Cap
            ctx.fillStyle = neonGlow;
            ctx.fillRect(pipe.x - 4, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 8, 16);

            ctx.shadowBlur = 0;
            
            // Scanning Laser Line between pipes (visual flair)
            const laserY = pipe.topHeight + (PIPE_GAP / 2) + Math.sin(state.current.frames * 0.1) * (PIPE_GAP * 0.3);
            ctx.fillStyle = isPurple ? 'rgba(168,85,247,0.3)' : 'rgba(6,182,212,0.3)';
            ctx.fillRect(pipe.x, laserY, PIPE_WIDTH, 2);
        });

        // Draw Particles
        state.current.particles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Draw Bird
        const { birdY: y, birdVel: vy } = state.current;
        const rotation = Math.min(Math.max(vy * 0.1, -0.4), 1.2); 

        ctx.save();
        ctx.translate(50 + BIRD_SIZE/2, y + BIRD_SIZE/2);
        ctx.rotate(rotation);
        
        ctx.shadowColor = 'rgba(255,215,0,0.4)';
        ctx.shadowBlur = 15;

        // Ensure we handle when birdImg is not complete or empty 
        if (birdImg.current && birdImg.current.complete && birdImg.current.naturalHeight !== 0) {
            ctx.drawImage(birdImg.current, -BIRD_SIZE/2, -BIRD_SIZE/2, BIRD_SIZE, BIRD_SIZE);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, BIRD_SIZE/2 - 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fde047'; 
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    };

    const update = () => {
        if (gameState !== 'PLAYING') return;

        state.current.frames++;

        // Stars parallax
        state.current.stars.forEach(star => {
            star.x -= star.speed;
            if (star.x < 0) {
                star.x = GAME_WIDTH;
                star.y = Math.random() * GAME_HEIGHT;
            }
        });

        // Physics
        state.current.birdVel += GRAVITY;
        state.current.birdY += state.current.birdVel;

        // Trailing particle
        if (state.current.frames % 5 === 0) {
            spawnParticles(50 + BIRD_SIZE/2, state.current.birdY + BIRD_SIZE/2, 'TRAIL');
        }

        // Particles update
        state.current.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.maxLife !== 40) p.x -= PIPE_SPEED; // Crash particles don't move with world speed 
            p.life -= 1;
        });
        state.current.particles = state.current.particles.filter(p => p.life > 0);

        // Collision Check (Floor/Ceiling)
        if (state.current.birdY < 0 || state.current.birdY + BIRD_SIZE > GAME_HEIGHT) {
            spawnParticles(50 + BIRD_SIZE/2, state.current.birdY + BIRD_SIZE/2, 'CRASH');
            onGameOver(state.current.score);
            return;
        }

        // Pipe Logic
        const pipes = state.current.pipes;
        
        pipes.forEach(pipe => pipe.x -= PIPE_SPEED);

        const lastPipe = pipes[pipes.length - 1];
        if (lastPipe && GAME_WIDTH - lastPipe.x > 220) {
            pipes.push(spawnPipe(GAME_WIDTH));
        }

        if (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < -50) {
            state.current.pipes.shift();
        }

        // Collision Check (Pipes)
        const birdLeft = 54; 
        const birdRight = 50 + BIRD_SIZE - 4;
        const birdTop = state.current.birdY + 6; // slightly tighter hitbox
        const birdBottom = state.current.birdY + BIRD_SIZE - 6;

        for (let pipe of pipes) {
            if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
                if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
                    spawnParticles(50 + BIRD_SIZE/2, state.current.birdY + BIRD_SIZE/2, 'CRASH');
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

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        let animationId;
        const loop = () => {
             // Let particle animations run even if GAME_OVER so we see the crash burst
            if (gameState === 'PLAYING') {
                update();
            } else if (gameState === 'GAME_OVER') {
                 // only update particles to let them fade
                 state.current.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 1;
                 });
                 state.current.particles = state.current.particles.filter(p => p.life > 0);
            }
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
            className="rounded-xl shadow-2xl border border-white/10 overflow-hidden"
            style={{ touchAction: 'none' }}
        />
    );
};

export default GameCanvas;
