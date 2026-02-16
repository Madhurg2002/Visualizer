import React, { useEffect, useState, useRef } from "react";
import "./Index.css"
import { Algorithms } from "./algorithms";
import { Play, Pause, RotateCcw, MonitorPlay, MousePointer2, Flag, ArrowRightLeft, Grid3x3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Confetti from '../../../Components/Confetti';

export default function PathFinding() {
    const navigate = useNavigate();
    // Algorithm Descriptions
    const PATH_ALGO_DESCRIPTIONS = {
        1: "Dijkstra's Algorithm (Weighted): Guarantees the shortest path.",
        2: "Depth-First Search (Unweighted): Not guaranteed to find the shortest path.",
        3: "A* Search (Weighted): Uses heuristics, faster than Dijkstra.",
        4: "Breadth-First Search (Unweighted): Guarantees shortest path for unweighted graphs.",
        5: "Recursive Division (Maze Gen): Generates mazes.",
        6: "Greedy Best-First Search (Weighted): Faster than A* but no guarantee.",
        7: "Bidirectional BFS (Unweighted): Two simultaneous searches."
    };
    
    const [Grid, setGrid] = useState();
    const [size, setSize] = useState(20);
    const [speed, setSpeed] = useState(500);
    const [algo, setAlgo] = useState(1);
    const [showDesc, setShowDesc] = useState(false);
    const [isVisualizing, setIsVisualizing] = useState(false);

    const [mode, setMode] = useState(1);
    const [isSolved, setIsSolved] = useState(false);

    // Refs for persistent state without re-renders
    const mdRef = useRef(false);
    const startNodePos = useRef({ i: -1, j: -1 });
    const endNodePos = useRef({ i: -1, j: -1 });
    const SleepTime = useRef(500);
    
    const SetPoint = useRef(1);
    const AlgoNum = useRef(1);

    function lcp() { mdRef.current = false; }
    function lco() { mdRef.current = true; }

    function resetpath() {
        var blocks = document.getElementsByClassName("searching-path")
        Array.from(blocks).forEach(e => { e.className = "empty"; e.value = "" })
        blocks = document.getElementsByClassName("searching-path-current")
        Array.from(blocks).forEach(e => { e.className = "empty"; e.value = "" })
        blocks = document.getElementsByClassName("path")
        Array.from(blocks).forEach(e => { e.className = "empty"; e.value = "" })
        setIsSolved(false);
    }

    function resetGrid() {
        if (isVisualizing) return;
        resetpath()
        var blocks = document.getElementsByClassName("blockage")
        Array.from(blocks).forEach(e => { e.className = "empty"; e.value = 0; })
    }

    async function handleChangeSetBlock(val) {
        SetPoint.current = val;
        setMode(val);
    }

    function change(e) {
        if (isVisualizing) return;
        if (e.target.className === "blockage" || e.target.className === "start" || e.target.className === "end") return
        else if (mdRef.current) {
            e.target.value = ""

            // Calculate i and j from attributes to update refs
            const currentI = parseInt(e.target.getAttribute('data-i'));
            const currentJ = parseInt(e.target.getAttribute('data-j'));

            if (SetPoint.current === 2) {
                const block = document.getElementsByClassName("start");
                Array.from(block).forEach(e => {
                    e.className = "empty"
                })
                e.target.className = "start";
                startNodePos.current = { i: currentI, j: currentJ };
                SetPoint.current = 1; 
                setMode(1);
            }
            else if (SetPoint.current === 3) {
                const block = document.getElementsByClassName("end");
                Array.from(block).forEach(e => {
                    e.className = "empty"
                })
                e.target.className = "end";
                endNodePos.current = { i: currentI, j: currentJ };
                SetPoint.current = 1;
                setMode(1);
            }
            else
                e.target.className = "blockage";
        }
    }

    const abortController = useRef(null);

    async function algoMain() {
        if (isVisualizing) return;
        
        const start = document.getElementsByClassName("start")[0]
        if (!start) { alert("Select Start"); return; }
        const end = document.getElementsByClassName("end")[0]
        if (!end) { alert("Select End"); return; }
        
        setIsVisualizing(true);
        resetpath();

        // Create new AbortController
        abortController.current = new AbortController();
        const signal = abortController.current.signal;

        try {
            var ei = parseInt(end.getAttribute("data-i"))
            var ej = parseInt(end.getAttribute("data-j"))
            var solved = false;
    
            const currentAlgo = AlgoNum.current; // Use ref value
    
            switch (currentAlgo) {
                case 1:
                    console.log("Dijkstra");
                    solved = await Algorithms.Dijkstra(size, SleepTime.current, signal);
                    break;
                case 2:
                    console.log("DFS");
                    solved = await Algorithms.DFS(size, SleepTime.current, signal);
                    break;
                case 3:
                    console.log("A*");
                    solved = await Algorithms.A_Star(size, SleepTime.current, signal);
                    break;
                case 4:
                    console.log("BFS");
                    solved = await Algorithms.BFS(size, SleepTime.current, signal);
                    break;
                case 5:
                    resetGrid();
                    // Maze Gen
                    await Algorithms.RecursiveDivision(0, 0, size - 1, (2 * size) - 1, 1, size, signal);
                    setIsVisualizing(false);
                    return; 
                case 6:
                    console.log("Greedy Best-First");
                    solved = await Algorithms.GreedyBestFirst(size, SleepTime.current, signal);
                    break;
                case 7:
                    console.log("Bidirectional BFS");
                    solved = await Algorithms.BidirectionalBFS(size, SleepTime.current, signal);
                    break;
                default:
                    solved = await Algorithms.Dijkstra(size, SleepTime.current, signal);
                    break;
            }
    
            if (solved && !signal.aborted) {
                // Trace path
                await Algorithms.PathFind(ei, ej, parseInt(end.value) - 1, size, SleepTime.current, signal);
                setIsSolved(true);
            }
        } catch (error) {
            if (error.message === "Aborted") {
                console.log("Algorithm stopped by user.");
            } else {
                console.error("Algorithm error:", error);
            }
        } finally {
            setIsVisualizing(false);
            abortController.current = null;
        }
    }

    function handleStop() {
        if (abortController.current) {
            abortController.current.abort();
        }
    }

    function handleChangeAlgorithm(e) {
        if (isVisualizing) return; 
        const val = parseInt(e.target.value);
        AlgoNum.current = val;
        setAlgo(val);
    }

    function handleChangeSpeed(e) {
        setSpeed(e.target.value);
        SleepTime.current = e.target.value;
    }

    // Grid Generation Effect
    useEffect(() => {
        var temp2 = [];
        
        // Always recalculate positions based on new size to keep them relative
        // Default positions: Start at ~25% width, End at ~75% width, vertical center
        const newStartI = Math.floor(size / 4);
        const newStartJ = Math.floor(size / 2);
        const newEndI = Math.floor(7 * size / 4);
        const newEndJ = Math.floor(size / 2);

        // Update refs
        startNodePos.current = { i: newStartI, j: newStartJ };
        endNodePos.current = { i: newEndI, j: newEndJ };

        const startCoords = startNodePos.current;
        const endCoords = endNodePos.current;

        for (let j = 0; j < size; j++) {
            var temp = [];
            for (let i = 0; i < size * 2; i++) {
                let className = "empty";
                if (i === startCoords.i && j === startCoords.j) className = "start";
                else if (i === endCoords.i && j === endCoords.j) className = "end";

                temp.push(
                    <button
                        key={`${i}-${j}`}
                        id={`c-${i}-${j}`}
                        data-i={i}
                        data-j={j}
                        className={className}
                        onMouseEnter={change}
                        onMouseUp={lcp}
                        onMouseDown={e => { lco(); change(e) }}
                    />
                );
            }
            temp2.push(
                <div key={j} id={`j-${j}`} className="board-rows">
                    {temp}
                </div>
            );
        }
        setGrid(<>{temp2}</>);
    }, [size]);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[#0B0C15] font-sans overflow-x-hidden">
             {isSolved && <Confetti />}
             
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-50">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px]" />
            </div>

            {/* Main Content (Left) */}
            <div className="flex-1 flex flex-col p-6 relative h-full z-10 transition-all">
                
                {/* Header */}
                 <div className="w-full flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <button
                        onClick={() => window.history.back()} // Fallback or use navigate
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all w-fit"
                    >
                        <ArrowRightLeft className="rotate-180" size={18} /> Back
                    </button>

                    <div className="text-center flex-1 pr-20">
                        <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 drop-shadow-sm mb-1">
                            Pathfinding Visualizer
                        </h1>
                         <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                            Explore Search Algorithms
                        </p>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex justify-center mb-4">
                     <div className="flex flex-wrap items-center justify-center gap-4 py-2 px-6 bg-slate-900/60 backdrop-blur-md rounded-full border border-white/5 text-xs font-bold text-slate-400 uppercase tracking-wide shadow-sm">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-green-500 rounded-sm shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div> Start</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div> End</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-slate-600 border border-slate-500 rounded-sm"></div> Wall</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-indigo-500/50 rounded-sm ring-1 ring-indigo-400/30"></div> Visited</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-amber-400 rounded-sm shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div> Path</div>
                    </div>
                </div>

                {/* Grid Container */}
                <div className="flex-grow relative shadow-2xl border border-white/10 rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                     <div className="w-full flex flex-col justify-center">
                        {Grid}
                     </div>
                </div>
            </div>

            {/* Sidebar Controls (Right) */}
            <div className="w-full lg:w-80 h-auto lg:h-full bg-slate-900/80 backdrop-blur-xl border-t lg:border-l border-white/10 p-6 flex flex-col shadow-2xl z-20 overflow-y-auto">
                 <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-2">
                    Configuration
                </div>

                <div className="flex flex-col gap-6">
                    {/* Algorithm */}
                     <div className="flex flex-col relative"
                        onMouseEnter={() => setShowDesc(true)}
                        onMouseLeave={() => setShowDesc(false)}
                    >
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2 cursor-help">
                            Algorithm <span className="text-slate-600 text-[10px] ml-auto bg-slate-800 px-1.5 py-0.5 rounded">?</span>
                        </label>
                        <select
                            value={algo}
                            onChange={handleChangeAlgorithm}
                            disabled={isVisualizing}
                            className="bg-slate-800 border border-white/10 text-white text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500 hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                            <option value={1}>Dijkstra's</option>
                            <option value={2}>DFS (Unweighted)</option>
                            <option value={3}>A* Search</option>
                            <option value={4}>BFS (Unweighted)</option>
                            <option value={6}>Greedy Best-First</option>
                            <option value={7}>Bidirectional BFS</option>
                            <option value={5}>Generate Maze</option>
                        </select>

                         {/* Description Popover */}
                        {showDesc && (
                            <div className="absolute right-full top-0 mr-4 w-72 z-50 bg-slate-800 border-l-4 border-purple-500 p-4 rounded shadow-2xl animate-fade-in pointer-events-none border border-white/10">
                                <h3 className="text-base font-bold text-white mb-2">{algo === 5 ? "Recursive Maze" : document.querySelector(`option[value="${algo}"]`)?.text || "Algorithm"}</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {PATH_ALGO_DESCRIPTIONS[algo]}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Density */}
                    <div className="flex flex-col space-y-2">
                         <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span>Grid Size</span>
                            <span className="text-slate-300">{size}</span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={50}
                            defaultValue={size}
                            onChange={e => {
                                const val = e.target.value;
                                setTimeout(() => { setSize(val); resetGrid(); }, 500);
                            }}
                            step={1}
                            disabled={isVisualizing}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                     {/* Speed */}
                     <div className="flex flex-col space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span>Delay</span>
                            <span className="text-slate-300">{speed}ms</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="500"
                            step="10"
                            defaultValue={speed}
                            onChange={handleChangeSpeed}
                            disabled={isVisualizing}
                             className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                     {/* Tools */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tools</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleChangeSetBlock(1)}
                                className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border ${mode === 1 ? 'bg-slate-700 text-white border-slate-500' : 'bg-slate-800 text-slate-500 border-transparent hover:bg-slate-700'}`}
                                title="Draw Walls"
                            >
                                <Grid3x3 size={18} />
                                <span className="text-[10px] font-bold">Wall</span>
                            </button>
                            <button
                                onClick={() => handleChangeSetBlock(2)}
                                className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border ${mode === 2 ? 'bg-green-600/20 text-green-400 border-green-500/50' : 'bg-slate-800 text-slate-500 border-transparent hover:bg-slate-700'}`}
                                title="Move Start"
                            >
                                <MousePointer2 size={18} />
                                <span className="text-[10px] font-bold">Start</span>
                            </button>
                            <button
                                onClick={() => handleChangeSetBlock(3)}
                                className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border ${mode === 3 ? 'bg-red-600/20 text-red-400 border-red-500/50' : 'bg-slate-800 text-slate-500 border-transparent hover:bg-slate-700'}`}
                                title="Move End"
                            >
                                <Flag size={18} />
                                <span className="text-[10px] font-bold">End</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/10 w-full my-6"></div>

                 {/* Action Buttons */}
                 <div className="flex flex-col gap-3 mt-auto">
                    <button
                        onClick={() => !isVisualizing && algoMain()}
                        disabled={isVisualizing}
                        className={`
                            flex items-center justify-center gap-2 px-5 py-3 font-bold rounded-xl shadow-lg transition-all 
                            ${isVisualizing 
                            ? "bg-slate-700/50 text-slate-500 cursor-not-allowed border border-white/5" 
                            : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white hover:scale-[1.02] shadow-emerald-500/20"}
                        `}
                    >
                        {isVisualizing ? <MonitorPlay className="animate-pulse" size={18}/> : <Play size={18}/>} 
                        {isVisualizing ? "Running..." : "Start Algorithm"}
                    </button>
                    
                    <button
                        onClick={isVisualizing ? handleStop : resetGrid}
                        className={`
                            flex items-center justify-center gap-2 px-5 py-3 font-bold rounded-xl shadow-lg transition-all
                            ${isVisualizing
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"}
                        `}
                    >
                        {isVisualizing ? <><Pause size={18}/> Stop</> : <><RotateCcw size={18}/> Reset Board</>}
                    </button>
                </div>

            </div>
        </div>
    );
}
