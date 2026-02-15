import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Shuffle } from 'lucide-react'; // Removing Settings as not used
import { useNavigate } from 'react-router-dom';
import { generateGraph, prims, kruskals } from './algorithms';

const MST = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    
    // Config
    const [algoName, setAlgoName] = useState('kruskals'); 
    const [nodeCount, setNodeCount] = useState(15);
    const [speed, setSpeed] = useState(100); 
    
    // State
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [status, setStatus] = useState('Idle'); 
    const [displayState, setDisplayState] = useState({ mst: [], current: null, visited: [], message: 'Ready' });
    
    const generatorRef = useRef(null);
    const timerRef = useRef(null);

    // Initialize
    const reset = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        const w = window.innerWidth; 
        const h = window.innerHeight;
        // Generate
        const newGraph = generateGraph(nodeCount, w, h);
        setGraph(newGraph);
        setDisplayState({ mst: [], current: null, visited: [], message: 'Ready' });
        setStatus('Idle');
    }, [nodeCount]);

    useEffect(() => {
        reset();
    }, [reset]);
    
    // Handle Window Resize
    useEffect(() => {
         const handleResize = () => {
             if (canvasRef.current) {
                canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
                // Don't regenerate graph on resize, just let it render (nodes might be off-screen if shrunk vastly)
            }
        }
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            setDisplayState(prev => ({
                mst: value.mst || [],
                current: value.current,
                visited: value.visited || prev.visited, // Prim's
                message: value.message
            }));
        }
    }, []);

    const toggleRun = () => {
        if (status === 'Running') {
            setStatus('Paused');
            clearInterval(timerRef.current);
        } else {
             if (status === 'Finished') {
                 // Reuse graph, just restart algo
                 setDisplayState({ mst: [], current: null, visited: [], message: 'Restarting...' });
                 setTimeout(() => startAlgo(), 100);
                 return;
             }
            startAlgo();
        }
    };

    const startAlgo = () => {
        if (status === 'Running') return; // Already running logic handled in toggle
        
        setStatus('Running');
        if (algoName === 'kruskals') generatorRef.current = kruskals(graph.nodes, graph.edges);
        else generatorRef.current = prims(graph.nodes, graph.edges);
        
        timerRef.current = setInterval(nextStep, speed);
    };
    
    // Update speed
    useEffect(() => {
        if (status === 'Running') {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(nextStep, speed);
        }
    }, [speed, status, nextStep]);

    // Draw
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw Edges
        graph.edges.forEach(edge => {
            const u = graph.nodes[edge.source];
            const v = graph.nodes[edge.target];
            
            const isMst = displayState.mst.includes(edge);
            const isCurrent = displayState.current === edge;
            
            ctx.beginPath();
            ctx.moveTo(u.x, u.y);
            ctx.lineTo(v.x, v.y);
            
            if (isCurrent) {
                ctx.strokeStyle = '#facc15'; // Yellow
                ctx.lineWidth = 4;
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 10;
            } else if (isMst) {
               ctx.strokeStyle = '#22c55e'; // Green
                ctx.lineWidth = 4;
                ctx.shadowColor = '#22c55e';
                ctx.shadowBlur = 10;
            } else {
                ctx.strokeStyle = '#334155'; // Slate-700
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
            
            // Draw Weight Label
            const midX = (u.x + v.x) / 2;
            const midY = (u.y + v.y) / 2;
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.shadowBlur = 0;
            // Draw background for text?
            if (isMst || isCurrent) {
                 ctx.fillStyle = '#ffffff';
                 ctx.font = 'bold 12px monospace';
            }
            ctx.fillText(edge.weight, midX, midY); 
        });

        // Draw Nodes
        graph.nodes.forEach(node => {
            const isVisited = displayState.visited && displayState.visited.includes(node.id);
            // In Prim's, visited nodes are part of MST tree usually
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b'; // Slate-900 fill
            
            ctx.fill();
            ctx.lineWidth = 2;
             if (isVisited) {
                ctx.strokeStyle = '#22c55e';
            } else {
                ctx.strokeStyle = '#64748b';
            }
            ctx.stroke();

            // ID
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(node.id, node.x, node.y);
        });

    }, [graph, displayState]);

    return (
        <div className="min-h-screen bg-[#0B0C15] text-white flex flex-col p-4 relative overflow-hidden font-sans">
            
             {/* Header */}
            <div className="z-10 flex flex-col md:flex-row justify-between items-start gap-4 mb-4 pointer-events-none md:pointer-events-auto">
                 <button
                        onClick={() => navigate('/')}
                        className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white w-fit"
                    >
                        <ArrowLeft size={18} /> Back
                </button>

                <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl min-w-[300px]">
                        <h1 className="text-2xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                            MST Visualizer
                        </h1>
                        <p className="text-xs text-slate-500 mb-4 h-4 truncate">{displayState.message || "Ready"}</p>
                        
                        <div className="flex flex-col gap-4">
                            {/* Algo Toggle */}
                             <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
                                 <button onClick={() => {if(status!=='Running') setAlgoName('kruskals')}} className={`flex-1 py-1.5 rounded text-xs font-bold ${algoName==='kruskals' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400'}`}>Kruskal's</button>
                                 <button onClick={() => {if(status!=='Running') setAlgoName('prims')}} className={`flex-1 py-1.5 rounded text-xs font-bold ${algoName==='prims' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400'}`}>Prim's</button>
                             </div>

                             {/* Controls */}
                             <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                        <span>Nodes</span>
                                        <span>{nodeCount}</span>
                                    </div>
                                    <input 
                                        type="range" min="5" max="50" 
                                        value={nodeCount} 
                                        onChange={(e) => { if(status!=='Running') setNodeCount(Number(e.target.value)); }}
                                        disabled={status === 'Running'}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                        <span>Speed</span>
                                        <span>{505 - speed}ms</span>
                                    </div>
                                    <input 
                                        type="range" min="5" max="500" 
                                        value={505 - speed} 
                                        onChange={(e) => setSpeed(505 - Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
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
                                            : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                                        }
                                    `}
                                >
                                    {status === 'Running' ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {status === 'Paused' ? 'Resume' : 'Start'}</>}
                                </button>
                                <button
                                    onClick={reset}
                                    disabled={status === 'Running'}
                                    className="py-2 rounded-lg font-bold bg-slate-700/50 text-slate-300 border border-white/10 hover:bg-slate-600 hover:text-white flex items-center justify-center gap-2"
                                >
                                    <Shuffle size={16} /> New Graph
                                </button>
                            </div>

                        </div>
                </div>
            </div>

            {/* Canvas */}
            <div className="absolute inset-0 z-0 pl-0 pt-0 md:pl-0 md:pt-0">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

        </div>
    );
};

export default MST;
