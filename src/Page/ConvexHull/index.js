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
                // If finished, reset? No, Start usually means from scratch or resume. 
                // Creating new generator if Idle
                if (status === 'Finished') {
                     reset();
                     setTimeout(() => {
                        startAlgo();
                     }, 100);
                     return;
                }
                startAlgo();
            } else {
                // Paused -> Resume
                setStatus('Running');
                timerRef.current = setInterval(nextStep, speed);
            }
        }
    };

    const startAlgo = () => {
        setStatus('Running');
        if (algoName === 'graham') generatorRef.current = grahamScan(points);
        else if (algoName === 'gift') generatorRef.current = giftWrapping(points);
        else generatorRef.current = monotoneChain(points);
        
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
        <div className="min-h-screen bg-[#0B0C15] text-white flex flex-col p-4 relative overflow-hidden font-sans">
            
            {/* Header / Controls */}
            <div className="z-10 flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex flex-col gap-4">
                     <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white w-fit"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl min-w-[300px]">
                        <h1 className="text-2xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
                            Convex Hull
                        </h1>
                        <p className="text-xs text-slate-500 mb-4 h-4">{displayState.message || "Ready"}</p>
                        
                        <div className="flex flex-col gap-4">
                            {/* Algo Select */}
                            <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
                                {['graham', 'gift', 'monotone'].map(algo => (
                                    <button
                                        key={algo}
                                        onClick={() => { if(status !== 'Running') setAlgoName(algo); }}
                                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all
                                            ${algoName === algo ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}
                                            ${status === 'Running' ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        {algo}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Sliders */}
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                        <span>Points</span>
                                        <span>{pointCount}</span>
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
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                        <span>Speed</span>
                                        <span>{205 - speed}ms</span>
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
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button
                                    onClick={toggleRun}
                                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                                        ${status === 'Running' 
                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
                                            : 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20'
                                        }
                                    `}
                                >
                                    {status === 'Running' ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {status === 'Paused' ? 'Resume' : 'Start'}</>}
                                </button>
                                <button
                                    onClick={reset}
                                    disabled={status === 'Running'}
                                    className="py-2 rounded-lg font-bold bg-slate-700/50 text-slate-300 border border-white/10 hover:bg-slate-600 hover:text-white flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <RotateCcw size={16} /> Reset
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div className="absolute inset-0 z-0 md:pl-[340px] md:pt-4 md:pr-4 md:pb-4 pt-[320px] px-4 pb-4">
                 <div className="w-full h-full bg-[#0F111A] rounded-2xl border border-white/5 relative overflow-hidden shadow-inner">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                 </div>
            </div>

        </div>
    );
};

export default ConvexHull;
