import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RefreshCw, Bot, BrainCircuit, User, ChevronUp, ChevronDown,
    ChevronLeft, ChevronRight, Cog, Dices, Check, Zap,
} from 'lucide-react';

import PageHeader, { Pill } from '../../../Components/PageHeader';
import Confetti from '../../../Components/Confetti';
import useInterval from './hooks/useInterval';
import { createGame, step, queueDir, randomSeed, GRID_W } from './game';
import { nextMove as bfsNextMove } from './brains';
import { scoreOptions, DEFAULT_LLM_SETTINGS } from './llmBrain';
import SnakeBoard from './SnakeBoard';

const SPEEDS = {
    chill: { label: 'Chill', ms: 160 },
    classic: { label: 'Classic', ms: 110 },
    fast: { label: 'Fast', ms: 70 },
    insane: { label: 'Insane', ms: 45 },
};

const BRAINS = [
    { key: 'human', label: 'You', icon: User, hint: 'Arrow keys / WASD' },
    { key: 'bfs', label: 'BFS Bot', icon: Bot, hint: 'BFS + tail-chase survival' },
    { key: 'llm', label: 'LLM Brain', icon: BrainCircuit, hint: 'OpenJev-style option logits' },
];

const LLM_STORAGE_KEY = 'snakeLlmSettings';

function loadLlmSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(LLM_STORAGE_KEY) || '{}');
        // apiKey is intentionally session-only (never persisted)
        return { ...DEFAULT_LLM_SETTINGS, ...saved, apiKey: '' };
    } catch {
        return { ...DEFAULT_LLM_SETTINGS };
    }
}

export default function Snake() {
    const navigate = useNavigate();
    const query = useMemo(() => new URLSearchParams(window.location.search), []);

    const urlSeed = query.get('seed') || '';
    const urlBrain = BRAINS.some((b) => b.key === query.get('brain')) ? query.get('brain') : 'human';
    const urlSpeed = SPEEDS[query.get('speed')] ? query.get('speed') : 'classic';

    const [seedInput, setSeedInput] = useState(urlSeed);
    const [game, setGame] = useState(() => createGame(urlSeed || randomSeed()));
    const [phase, setPhase] = useState('idle'); // idle | playing | paused | over | won
    const [brain, setBrain] = useState(urlBrain);
    const [speedKey, setSpeedKey] = useState(urlSpeed);
    const [highScore, setHighScore] = useState(() =>
        parseInt(localStorage.getItem('snakeHighScore') || '0', 10)
    );

    // LLM brain state
    const [llmSettings, setLlmSettings] = useState(loadLlmSettings);
    const [showLlmSettings, setShowLlmSettings] = useState(false);
    const [llmProbs, setLlmProbs] = useState(null); // { up, down, left, right }
    const [llmStatus, setLlmStatus] = useState('idle'); // idle | thinking | ok | error
    const [llmError, setLlmError] = useState('');
    const [llmResult, setLlmResult] = useState(null); // { latencyMs, raw }
    const llmBusyRef = useRef(false);
    const llmFallbackNotedRef = useRef(false);

    // Keep URL shareable (like Sudoku's seed links)
    useEffect(() => {
        const params = new URLSearchParams();
        if (game.seed) params.set('seed', game.seed);
        if (brain !== 'human') params.set('brain', brain);
        if (speedKey !== 'classic') params.set('speed', speedKey);
        const qs = params.toString();
        navigate(qs ? `?${qs}` : window.location.pathname, { replace: true });
    }, [game.seed, brain, speedKey, navigate]);

    const startGame = useCallback((seedOverride) => {
        const s = seedOverride || randomSeed();
        setGame(createGame(s));
        setSeedInput(s);
        setLlmProbs(null);
        setLlmStatus('idle');
        setLlmError('');
        setLlmResult(null);
        llmFallbackNotedRef.current = false;
        setPhase('playing');
    }, []);

    const restart = useCallback(() => startGame(), [startGame]);

    const handleApplySeed = useCallback(() => {
        const s = seedInput.trim();
        if (s && s !== game.seed) startGame(s);
    }, [seedInput, game.seed, startGame]);

    const randomizeSeed = useCallback(() => startGame(randomSeed()), [startGame]);

    // Persist LLM settings (without the API key)
    const saveLlmSettings = useCallback((next) => {
        setLlmSettings(next);
        const { apiKey, ...persistable } = next;
        localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(persistable));
    }, []);

    // Game loop — paused unless playing. LLM ticks are skipped while a request is in flight.
    const gameTick = useCallback(async () => {
        if (phase !== 'playing') return;

        if (brain === 'human') {
            setGame((g) => {
                const next = step(g, null);
                if (!next.alive) setPhase('over');
                else if (next.won) setPhase('won');
                return next;
            });
            return;
        }

        if (brain === 'bfs') {
            setGame((g) => {
                const move = bfsNextMove(g);
                const next = step(g, move);
                if (!next.alive) setPhase('over');
                else if (next.won) setPhase('won');
                return next;
            });
            return;
        }

        // LLM brain (OpenJev-style): score the four options, pick the top one.
        if (llmBusyRef.current) return; // request still in flight — skip this tick
        llmBusyRef.current = true;
        setLlmStatus('thinking');
        try {
            const result = await scoreOptions(game, llmSettings);
            setLlmProbs(Object.fromEntries(result.options.map((o) => [o.dir, o.prob])));
            setLlmResult({ latencyMs: result.latencyMs, raw: result.raw });
            setLlmStatus('ok');
            setLlmError('');
            llmFallbackNotedRef.current = false;
            setGame((g) => {
                const next = step(g, result.chosen);
                if (!next.alive) setPhase('over');
                else if (next.won) setPhase('won');
                return next;
            });
        } catch (err) {
            // One-time fallback notice, then play on with the BFS bot so the game continues.
            if (!llmFallbackNotedRef.current) {
                setLlmStatus('error');
                setLlmError(err?.message || 'LLM request failed');
                llmFallbackNotedRef.current = true;
            }
            setGame((g) => {
                const next = step(g, bfsNextMove(g));
                if (!next.alive) setPhase('over');
                else if (next.won) setPhase('won');
                return next;
            });
        } finally {
            llmBusyRef.current = false;
        }
    }, [phase, brain, game, llmSettings]);

    useInterval(gameTick, phase === 'playing' ? SPEEDS[speedKey].ms : null);

    // High score bookkeeping
    useEffect(() => {
        if ((phase === 'over' || phase === 'won') && game.score > highScore) {
            setHighScore(game.score);
            localStorage.setItem('snakeHighScore', String(game.score));
        }
    }, [phase, game.score, highScore]);

    // Keyboard controls
    useEffect(() => {
        const handleKey = (e) => {
            const dirKeys = {
                ArrowUp: 'up', w: 'up', W: 'up',
                ArrowDown: 'down', s: 'down', S: 'down',
                ArrowLeft: 'left', a: 'left', A: 'left',
                ArrowRight: 'right', d: 'right', D: 'right',
            };
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            if (e.key === ' ') {
                if (phase === 'idle' || phase === 'over' || phase === 'won') restart();
                else if (phase === 'playing') setPhase('paused');
                else if (phase === 'paused') setPhase('playing');
                return;
            }
            if (e.key === 'r' || e.key === 'R') { restart(); return; }
            if (brain !== 'human') return;
            const dir = dirKeys[e.key];
            if (dir) setGame((g) => queueDir(g, dir));
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [phase, brain, restart]);

    const speedButtons = useMemo(() => Object.entries(SPEEDS), []);
    const brainMeta = BRAINS.find((b) => b.key === brain);

    return (
        <div className="flex flex-col items-center w-full min-h-screen bg-[#0B0C15] font-sans pb-8 select-none">
            {phase === 'won' && <Confetti />}

            {/* Header */}
            <div className="w-full max-w-4xl px-4 pt-4 pb-1 mb-2">
                <PageHeader
                    title="Snake"
                    accent="from-emerald-400 via-green-400 to-cyan-400"
                    subtitle={
                        <>
                            <Pill>score {game.score}</Pill>
                            <Pill className="!text-emerald-400">best {highScore}</Pill>
                            <Pill>len {game.snake.length}</Pill>
                        </>
                    }
                    right={
                        <button
                            onClick={() => setShowLlmSettings(true)}
                            className="flex items-center justify-center p-3 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all shadow-lg"
                            title="LLM brain settings (OpenJev-style option logits)"
                        >
                            <Cog size={20} />
                        </button>
                    }
                />
            </div>

            {/* Brain + speed selectors */}
            <div className="w-full max-w-4xl px-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-center mb-4">
                <div className="flex justify-center bg-slate-900/50 rounded-full border border-white/10 p-1">
                    {BRAINS.map((b) => (
                        <button
                            key={b.key}
                            onClick={() => setBrain(b.key)}
                            title={b.hint}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                                brain === b.key
                                    ? b.key === 'llm'
                                        ? 'bg-purple-500/80 text-white'
                                        : b.key === 'bfs'
                                            ? 'bg-cyan-500/80 text-black'
                                            : 'bg-emerald-500/80 text-black'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <b.icon size={14} /> {b.label}
                        </button>
                    ))}
                </div>
                <div className="flex justify-center bg-slate-900/50 rounded-full border border-white/10 p-1">
                    {speedButtons.map(([key, s]) => (
                        <button
                            key={key}
                            onClick={() => setSpeedKey(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                                speedKey === key ? 'bg-amber-500/80 text-black' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Board */}
            <div className="relative w-full max-w-[560px] px-4">
                <SnakeBoard state={game} probs={llmProbs} brainActive={brain === 'llm'} />

                <AnimatePresence>
                    {phase === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl z-20 p-6 text-center"
                        >
                            <h2 className="text-3xl font-black text-white mb-2">Ready?</h2>
                            <p className="text-slate-300 text-sm mb-5">
                                {brain === 'human'
                                    ? 'Arrow keys / WASD to steer • Space to pause'
                                    : brain === 'bfs'
                                        ? 'The BFS bot hunts food and chases its tail to survive.'
                                        : 'An LLM scores up/down/left/right every tick — watch the logits.'}
                            </p>
                            <button
                                onClick={restart}
                                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Play size={18} /> Play
                            </button>
                        </motion.div>
                    )}

                    {phase === 'paused' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl z-20"
                        >
                            <div className="bg-slate-900/80 p-6 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-2 text-white font-bold text-xl">
                                <Pause size={24} /> Paused
                            </div>
                        </motion.div>
                    )}

                    {(phase === 'over' || phase === 'won') && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl z-30 p-6 text-center"
                        >
                            <h2 className="text-4xl font-black text-white mb-2">
                                {phase === 'won' ? 'Perfect Game!' : 'Game Over'}
                            </h2>
                            <p className="text-slate-300 mb-1">
                                {phase === 'over' ? `Crashed into the ${game.cause === 'wall' ? 'wall' : 'snake body'}.` : 'You filled the whole board.'}
                            </p>
                            <p className="text-slate-300 mb-6">
                                Score: <span className="text-emerald-400 font-bold">{game.score}</span>
                                {game.score >= highScore && game.score > 0 && (
                                    <span className="ml-2 text-amber-400 font-bold">New best!</span>
                                )}
                            </p>
                            <button
                                onClick={restart}
                                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <RefreshCw size={18} /> Play Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Seed row (shareable, like Sudoku) */}
            <div className="w-full max-w-[560px] px-4 mt-4 flex items-center gap-2">
                <input
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplySeed(); }}
                    placeholder="seed"
                    className="flex-1 min-w-0 bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    aria-label="Game seed"
                />
                <button
                    onClick={handleApplySeed}
                    className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all"
                    title="Load this seed"
                >
                    <Check size={18} />
                </button>
                <button
                    onClick={randomizeSeed}
                    className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 border border-white/10 hover:bg-slate-700/90 hover:text-white transition-all"
                    title="Random seed + new game"
                >
                    <Dices size={18} />
                </button>
            </div>

            {/* Play/Pause/Restart + LLM status */}
            <div className="w-full max-w-[560px] px-4 mt-3 flex flex-col gap-3">
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            if (phase === 'idle' || phase === 'over' || phase === 'won') restart();
                            else setPhase(phase === 'playing' ? 'paused' : 'playing');
                        }}
                        disabled={phase === 'idle'}
                        className={`flex-1 py-3 rounded-xl font-bold border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${
                            phase === 'playing'
                                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        }`}
                    >
                        {phase === 'playing' ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {phase === 'paused' ? 'Resume' : 'Play'}</>}
                    </button>
                    <button
                        onClick={restart}
                        className="flex-1 py-3 bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} /> Restart
                    </button>
                </div>

                {brain === 'llm' && (
                    <div className="bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 font-mono break-all">
                        <span className="flex items-center gap-2 mb-1 font-sans font-bold uppercase tracking-wider text-[10px] text-purple-300">
                            <BrainCircuit size={12} /> LLM Brain
                            {llmStatus === 'thinking' && <span className="text-slate-400 normal-case">scoring options…</span>}
                            {llmStatus === 'ok' && llmResult && (
                                <span className="text-emerald-400 normal-case">{llmResult.latencyMs}ms</span>
                            )}
                            {llmStatus === 'error' && (
                                <span className="text-red-400 normal-case">failed — BFS fallback</span>
                            )}
                        </span>
                        {llmStatus === 'error' && (
                            <p className="text-red-400/90 font-sans mb-1">{llmError}</p>
                        )}
                        {llmResult && (
                            <details>
                                <summary className="cursor-pointer text-slate-400 hover:text-slate-200 font-sans">
                                    last model response
                                </summary>
                                <pre className="mt-1 text-[10px] text-slate-400 whitespace-pre-wrap">{llmResult.raw}</pre>
                            </details>
                        )}
                        {llmStatus === 'idle' && (
                            <p className="text-slate-500 font-sans">
                                Uses an OpenAI-compatible endpoint (ollama, LM Studio, llama.cpp server, or hosted).
                                Configure it with the ⚙ button — falls back to the BFS bot on failure.
                            </p>
                        )}
                    </div>
                )}

                {/* Mobile D-pad */}
                <div className="grid grid-cols-3 gap-3 md:hidden mt-1">
                    <div />
                    <DPadButton onPress={() => setGame((g) => queueDir(g, 'up'))} icon={ChevronUp} />
                    <div />
                    <DPadButton onPress={() => setGame((g) => queueDir(g, 'left'))} icon={ChevronLeft} />
                    <DPadButton onPress={() => setPhase(phase === 'playing' ? 'paused' : 'playing')} icon={phase === 'playing' ? Pause : Play} />
                    <DPadButton onPress={() => setGame((g) => queueDir(g, 'right'))} icon={ChevronRight} />
                    <div />
                    <DPadButton onPress={() => setGame((g) => queueDir(g, 'down'))} icon={ChevronDown} />
                    <div />
                </div>

                <p className="text-slate-500 text-sm text-center hidden md:block mt-1">
                    {brain === 'human'
                        ? 'Arrow Keys / WASD to steer • Space to pause • R to restart'
                        : `${brainMeta.label}: ${brainMeta.hint} • Space to pause`}
                </p>
            </div>

            {/* LLM settings panel */}
            <AnimatePresence>
                {showLlmSettings && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        onClick={() => setShowLlmSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                                <BrainCircuit size={20} className="text-purple-400" /> LLM Brain Settings
                            </h3>
                            <p className="text-xs text-slate-400 mb-4">
                                Any OpenAI-compatible <code className="text-slate-300">/chat/completions</code> endpoint works —
                                a local WebGPU/OpenJev-style runtime, ollama, LM Studio, llama.cpp server, or a hosted API.
                                For ollama, run <code className="text-slate-300">OLLAMA_ORIGINS=*</code> so the browser may call it.
                            </p>
                            <div className="space-y-3">
                                <LabeledInput
                                    label="Base URL"
                                    value={llmSettings.baseUrl}
                                    onChange={(v) => setLlmSettings((s) => ({ ...s, baseUrl: v }))}
                                    placeholder="http://localhost:11434/v1"
                                />
                                <LabeledInput
                                    label="Model"
                                    value={llmSettings.model}
                                    onChange={(v) => setLlmSettings((s) => ({ ...s, model: v }))}
                                    placeholder="qwen2.5:0.5b"
                                />
                                <LabeledInput
                                    label="API key (optional, session only)"
                                    value={llmSettings.apiKey}
                                    onChange={(v) => setLlmSettings((s) => ({ ...s, apiKey: v }))}
                                    placeholder="sk-… (leave empty for local runtimes)"
                                    type="password"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <LabeledInput
                                        label="Temperature"
                                        value={String(llmSettings.temperature)}
                                        onChange={(v) => setLlmSettings((s) => ({ ...s, temperature: parseFloat(v) || 0 }))}
                                        type="number"
                                    />
                                    <LabeledInput
                                        label="Timeout (ms)"
                                        value={String(llmSettings.timeoutMs)}
                                        onChange={(v) => setLlmSettings((s) => ({ ...s, timeoutMs: parseInt(v, 10) || 4000 }))}
                                        type="number"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-5">
                                <button
                                    onClick={() => setShowLlmSettings(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => { saveLlmSettings(llmSettings); setShowLlmSettings(false); }}
                                    className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
                                >
                                    <Zap size={16} /> Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DPadButton({ onPress, icon: Icon }) {
    return (
        <button
            onPointerDown={(e) => { e.preventDefault(); onPress(); }}
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-300 active:scale-95 transition-transform"
        >
            <Icon size={26} />
        </button>
    );
}

function LabeledInput({ label, value, onChange, placeholder, type = 'text' }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</span>
            <input
                type={type}
                step="any"
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-800/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
            />
        </label>
    );
}
