import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Settings, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generatePoints, grahamScan, giftWrapping, monotoneChain } from './algorithms';

const ConvexHull = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    
    // Config
    const [algoName, setAlgoName] = useState('graham'); // 'graham', 'gift', 'monotone'
    const [pointCount, setPointCount] = useState(50);
    const [speed, setSpeed] = useState(50); // ms delay
    
    // State
    const [points, setPoints] = useState([]);
    const [status, setStatus] = useState('Idle'); // Idle, Running, Paused, Finished
    const [displayState, setDisplayState] = useState({ hull: [], current: null, check: null, best: null, message: '' });
    
    // Refs
    const generatorRef = useRef(null);
    const timerRef = useRef(null);
    const canvasSize = useRef({ w: 0, h: 0 });

    // Initialize
    const reset = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        const w = window.innerWidth; // Approximate for init
        const h = window.innerHeight;
        const newPoints = generatePoints(pointCount, w * 0.8, h * 0.7); // Smaller box
        setPoints(newPoints);
        setDisplayState({ hull: [], current: null, check: null, best: null, message: 'Ready' });
        setStatus('Idle');
        
        // Also ensure canvas is sized
        if (canvasRef.current) {
            canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
            canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
        }
    }, [pointCount]);

    useEffect(() => {
        reset();
        
        const handleResize = () => {
             if (canvasRef.current) {
                canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
                // Should regenerate points? Maybe just let them be.
            }
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [reset]);


    // Step Logic
    const nextStep = useCallback(() => {
        if (!generatorRef.current) return;
        
        const { value, done } = generatorRef.current.next();
        
        if (done) {
            setStatus('Finished');
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        
        if (value) {
            setDisplayState({
                hull: value.hull || [],
                current: value.current,
                check: value.check,
                best: value.best,
                bad: value.bad,
                message: value.message
            });
        }
    }, []);

    const toggleRun = () => {
        if (status === 'Running') {
            setStatus('Paused');
            clearInterval(timerRef.current);
        } else {
            if (status === 'Idle' || status === 'Finished') {
                if (status === 'Finished') {
                     // If finished, we want to reset the visualization state but KEEP the points
                     // so we can compare algorithms on the same dataset.
                     // Or if the user wants new points, they can click Reset.
                     // Let's assume hitting "Start" after finish implies "Re-run" (potentially with new algo).
                     
                     // We need to clear the display state first.
                     setDisplayState({ hull: [], current: null, check: null, best: null, message: 'Ready' });
                     
                     // We reuse the EXISTING points for comparison.
                     // So we don't call full reset().
                     
                     startAlgo(points); // Pass current points explicitly
                     return;
                }
                startAlgo(points);
            } else {
                // Paused -> Resume
                setStatus('Running');
                timerRef.current = setInterval(nextStep, speed);
            }
        }
    };

    const startAlgo = (pointsToUse) => {
        setStatus('Running');
        const p = pointsToUse || points; // Use passed points or state points
        
        if (algoName === 'graham') generatorRef.current = grahamScan(p);
        else if (algoName === 'gift') generatorRef.current = giftWrapping(p);
        else generatorRef.current = monotoneChain(p);
        
        timerRef.current = setInterval(nextStep, speed);
    };

    // Update speed live
    useEffect(() => {
        if (status === 'Running') {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(nextStep, speed);
        }
    }, [speed, status, nextStep]);


    // Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw All Points
        points.forEach(p => {
             // If point is 'bad' (rejected), maybe make it red?
             const isHull = displayState.hull.includes(p);
             const isCurrent = displayState.current === p;
             const isCheck = displayState.check === p;
             const isBest = displayState.best === p;

             ctx.beginPath();
             ctx.arc(p.x, p.y, isHull ? 6 : 4, 0, Math.PI * 2);
             
             if (isCurrent) ctx.fillStyle = '#facc15'; // Yellow
             else if (isCheck) ctx.fillStyle = '#ef4444'; // Red
             else if (isBest) ctx.fillStyle = '#a855f7'; // Purple
             else if (isHull) ctx.fillStyle = '#22c55e'; // Green
             else ctx.fillStyle = '#475569'; // Slate
             
             ctx.fill();
             
             if (isHull || isCurrent) {
                 ctx.shadowBlur = 10;
                 ctx.shadowColor = ctx.fillStyle;
             } else {
                 ctx.shadowBlur = 0;
             }
        });
        
        // Reset Shadow
        ctx.shadowBlur = 0;

        // Draw Hull Lines
        if (displayState.hull.length > 0) {
            ctx.beginPath();
            ctx.moveTo(displayState.hull[0].x, displayState.hull[0].y);
            for (let i = 1; i < displayState.hull.length; i++) {
                ctx.lineTo(displayState.hull[i].x, displayState.hull[i].y);
            }
            // If finished, close loop?
            // The algo yields hull points. Usually we connect them.
            
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            // ctx.setLineDash([]);
            ctx.stroke();
            
            // Draw active checking line
            if (displayState.current && displayState.check) {
                ctx.beginPath();
                ctx.moveTo(displayState.current.x, displayState.current.y);
                ctx.lineTo(displayState.check.x, displayState.check.y);
                ctx.strokeStyle = '#facc15'; // Yellow
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
             // Draw best candidate line (Gift Wrapping)
            if (displayState.current && displayState.best) {
                ctx.beginPath();
                ctx.moveTo(displayState.current.x, displayState.current.y);
                ctx.lineTo(displayState.best.x, displayState.best.y);
                ctx.strokeStyle = '#a855f7'; // Purple
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

    }, [points, displayState, canvasSize]);


    return (
        <div className="flex h-screen w-full bg-[#0B0C15] font-sans overflow-hidden">
            
            {/* Main Content (Left) */}
            <div className="flex-1 flex flex-col relative h-full z-10">
                
                {/* Header Overlay */}
                <div className="absolute top-6 left-6 z-20">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all w-fit"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    
                    <div className="mt-4 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 inline-block">
                        <p className="text-xs text-slate-400 font-mono">
                            {displayState.message || "Ready"}
                        </p>
                    </div>
                </div>

                {/* Canvas Container */}
                <div className="w-full h-full relative bg-[#0F111A]">
                     <div className="absolute inset-4 rounded-2xl border border-white/5 overflow-hidden shadow-inner bg-[#0F111A]">
                        <canvas ref={canvasRef} className="w-full h-full block" />
                     </div>
                </div>
            </div>

            {/* Sidebar Controls (Right) */}
            <div className="w-80 h-full bg-slate-900/80 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col shadow-2xl z-20 overflow-y-auto">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-2">
                    Configuration
                </div>

                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-2xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
                            Convex Hull
                        </h1>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Computational Geometry</p>
                    </div>

                    {/* Algo Select */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Algorithm</label>
                        <div className="flex flex-col bg-slate-800/50 rounded-lg p-1 border border-white/5 gap-1">
                            {['graham', 'gift', 'monotone'].map(algo => (
                                <button
                                    key={algo}
                                    onClick={() => { if(status !== 'Running') setAlgoName(algo); }}
                                    className={`py-2 rounded-md text-xs font-bold uppercase transition-all
                                        ${algoName === algo ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                                        ${status === 'Running' ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {algo === 'monotone' ? 'Monotone Chain' : algo === 'gift' ? 'Gift Wrapping' : 'Graham Scan'}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Sliders */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                <span>Points</span>
                                <span className="text-green-400 font-mono">{pointCount}</span>
                            </div>
                            <input 
                                type="range" min="10" max="200" 
                                value={pointCount} 
                                onChange={(e) => { if(status!=='Running') setPointCount(Number(e.target.value)); }}
                                disabled={status === 'Running'}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                <span>Speed</span>
                                <span className="text-green-400 font-mono">{205 - speed}ms</span>
                            </div>
                            <input 
                                type="range" min="5" max="200" 
                                value={205 - speed} 
                                onChange={(e) => setSpeed(205 - Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <button
                            onClick={toggleRun}
                            className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                ${status === 'Running' 
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30' 
                                    : 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20'
                                }
                            `}
                        >
                            {status === 'Running' ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {status === 'Paused' ? 'Resume' : 'Start'}</>}
                        </button>
                        <button
                            onClick={reset}
                            disabled={status === 'Running'}
                            className="py-3 rounded-xl font-bold bg-slate-700/50 text-slate-300 border border-white/10 hover:bg-slate-600 hover:text-white flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <RotateCcw size={18} /> Reset
                        </button>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default ConvexHull;
