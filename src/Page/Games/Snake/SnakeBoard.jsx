import React, { useEffect, useRef, useCallback } from 'react';
import { GRID_W, GRID_H } from './game';
import { MOVE_OPTIONS } from './llmBrain';

const CELL = 22; // logical px per cell; canvas scales responsively via CSS
const PAD = 8;
const TOPBAR = 28; // strip height for LLM probability bars

const BAR_COLORS = [
    'rgba(96,165,250,0.75)',
    'rgba(167,139,250,0.75)',
    'rgba(251,146,60,0.75)',
    'rgba(52,211,153,0.75)',
];

function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * Canvas renderer for Snake. Pure draw function of (state, probs).
 */
export default function SnakeBoard({ state, probs = null, brainActive = false }) {
    const canvasRef = useRef(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = GRID_W * CELL + PAD * 2;
        const H = GRID_H * CELL + PAD * 2 + (probs && brainActive ? TOPBAR : 0);

        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
        }
        canvas.style.width = '100%';
        canvas.style.height = 'auto';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        const top = probs && brainActive ? TOPBAR : 0;

        // Subtle grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= GRID_W; x++) {
            ctx.beginPath();
            ctx.moveTo(PAD + x * CELL + 0.5, PAD + top);
            ctx.lineTo(PAD + x * CELL + 0.5, PAD + top + GRID_H * CELL);
            ctx.stroke();
        }
        for (let y = 0; y <= GRID_H; y++) {
            ctx.beginPath();
            ctx.moveTo(PAD, PAD + top + y * CELL + 0.5);
            ctx.lineTo(PAD + GRID_W * CELL, PAD + top + y * CELL + 0.5);
            ctx.stroke();
        }

        // Food: glowing apple
        if (state && state.food) {
            const fx = PAD + state.food.x * CELL;
            const fy = PAD + top + state.food.y * CELL;
            const glow = ctx.createRadialGradient(fx + CELL / 2, fy + CELL / 2, 2, fx + CELL / 2, fy + CELL / 2, 12);
            glow.addColorStop(0, 'rgba(244, 63, 94, 0.8)');
            glow.addColorStop(1, 'rgba(244, 63, 94, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(fx - 6, fy - 6, CELL + 12, CELL + 12);
            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            ctx.arc(fx + CELL / 2, fy + CELL / 2, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Snake: rounded body fading tail-ward, glowing head
        if (state && state.snake) {
            state.snake.forEach((p, i) => {
                const t = i / Math.max(1, state.snake.length - 1);
                const x = PAD + p.x * CELL + 2;
                const y = PAD + top + p.y * CELL + 2;
                const size = CELL - 4;
                if (i === 0) {
                    ctx.fillStyle = '#34d399';
                    ctx.shadowColor = 'rgba(52,211,153,0.9)';
                    ctx.shadowBlur = 14;
                } else {
                    ctx.fillStyle = `rgba(52, 211, 153, ${Math.max(0.25, 0.7 - t * 0.25)})`;
                }
                roundRectPath(ctx, x, y, size, size, 6);
                ctx.fill();
                ctx.shadowBlur = 0;
            });
        }

        // LLM probability bars along the top edge (OpenJev-style option logits)
        if (probs && brainActive) {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(0, 0, W, TOPBAR);
            MOVE_OPTIONS.forEach((dir, i) => {
                const barW = W / 4;
                const prob = probs[dir] ?? 0;
                ctx.fillStyle = BAR_COLORS[i % BAR_COLORS.length];
                const h = Math.max(1, prob * (TOPBAR - 6));
                ctx.fillRect(i * barW + 3, TOPBAR - 2 - h, barW - 6, h);
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.font = 'bold 10px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${dir} ${Math.round(prob * 100)}%`, i * barW + barW / 2, 11);
            });
        }
    }, [state, probs, brainActive]);

    useEffect(() => {
        draw();
    }, [draw]);

    return (
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f172a]/80">
            <canvas
                ref={canvasRef}
                className="block w-full h-auto"
                role="img"
                aria-label="Snake game board"
            />
        </div>
    );
}
