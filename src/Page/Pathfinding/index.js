import React, { useEffect, useState, useRef } from "react";
import "./Index.css"
import { Algorithms } from "./algorithms";

export default function PathFinding() {
    // Algorithm Descriptions
    const PATH_ALGO_DESCRIPTIONS = {
        1: "Dijkstra's Algorithm (Weighted): The father of pathfinding algorithms; guarantees the shortest path. It explores nodes in all directions, favoring those with lower accumulated cost.",
        2: "Depth-First Search (Unweighted): Explores as far as possible along each branch before backtracking. It is NOT guaranteed to find the shortest path and can be very inefficient for pathfinding.",
        3: "A* Search (Weighted): The gold standard for pathfinding. It uses heuristics to guide the search towards the target, making it much faster than Dijkstra while still guaranteeing the shortest path.",
        4: "Breadth-First Search (Unweighted): Explores all neighbor nodes at the present depth prior to moving on to the nodes at the next depth level. Guarantees the shortest path for unweighted graphs.",
        5: "Recursive Division (Maze Gen): A method for generating mazes. It works by recursively dividing the grid into chambers with walls, leaving gaps for passage.",
        6: "Greedy Best-First Search (Weighted): Expands the node that is closest to the goal, as estimated by a heuristic. It is faster than A* but does not guarantee the shortest path.",
        7: "Bidirectional BFS (Unweighted): Runs two simultaneous breadth-first searches: one forward from the initial state, and one backward from the goal, stopping when the two meet. Can be much faster than standard BFS."
    };
    
    const [Grid, setGrid] = useState();
    const [size, setSize] = useState(20);
    const [speed, setSpeed] = useState(500);
    const [algo, setAlgo] = useState(1);
    const [showDesc, setShowDesc] = useState(false);
    const [isVisualizing, setIsVisualizing] = useState(false);

    // Refs for persistent state without re-renders
    const mdRef = useRef(false);
    const startNodePos = useRef({ i: -1, j: -1 });
    const endNodePos = useRef({ i: -1, j: -1 });
    const SleepTime = useRef(500);
    
    // Replaces global SetPoint and AlgoNum
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
    }

    function resetGrid() {
        if (isVisualizing) return;
        resetpath()
        var blocks = document.getElementsByClassName("blockage")
        Array.from(blocks).forEach(e => { e.className = "empty"; e.value = 0; })
    }

    async function handleChangeSetBlock(e) {
        const val = parseInt(e.target.value);
        SetPoint.current = val;
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
            }
            else if (SetPoint.current === 3) {
                const block = document.getElementsByClassName("end");
                Array.from(block).forEach(e => {
                    e.className = "empty"
                })
                e.target.className = "end";
                endNodePos.current = { i: currentI, j: currentJ };
                SetPoint.current = 1;
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
        <div className="flex flex-col h-full w-full bg-slate-50 items-center overflow-hidden">
            {/* Navbar / Controls */}
            <div className="w-full bg-white shadow-md p-4 flex flex-wrap items-center justify-center gap-4 z-10">

                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                        Grid Density <span className="text-slate-400">({size})</span>
                    </label>
                    <input
                        type="range"
                        min={10}
                        max={50}
                        defaultValue={size}
                        title={`Current Density: ${size}`}
                        onChange={e => {
                            const val = e.target.value;
                            setTimeout(() => { setSize(val); resetGrid(); }, 500);
                        }}
                        step={1}
                        disabled={isVisualizing}
                        className={`w-32 h-2 rounded-lg appearance-none ${isVisualizing ? "bg-slate-300 cursor-not-allowed" : "bg-slate-200 cursor-pointer accent-blue-600"}`}
                    />
                </div>

                <div className="flex flex-col relative"
                    onMouseEnter={() => setShowDesc(true)}
                    onMouseLeave={() => setShowDesc(false)}
                >
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 cursor-help">
                        Algorithm <span className="text-slate-400 text-[10px]">(Hover for info)</span>
                    </label>
                    <select
                        value={algo}
                        onChange={handleChangeAlgorithm}
                        className="bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 outline-none focus:ring-blue-500"
                    >
                        <option value={1}>Concurrent Dijkstra</option>
                        <option value={2}>DFS</option>
                        <option value={3}>A-Star</option>
                        <option value={4}>BFS (Shortest Path)</option>
                        <option value={6}>Greedy Best-First Search</option>
                        <option value={7}>Bidirectional BFS</option>
                        <option value={5}>Generate Maze</option>
                    </select>

                    {/* Description Popover */}
                    {showDesc && (
                        <div className="absolute top-full left-0 mt-2 w-96 z-50 bg-white border-l-4 border-green-500 p-4 rounded shadow-xl animate-fade-in pointer-events-none">
                            <h3 className="text-lg font-bold text-green-800 mb-1">
                                {algo === 1 ? "Dijkstra's Algorithm" :
                                    algo === 2 ? "Depth-First Search (DFS)" :
                                        algo === 3 ? "A* Search" :
                                            algo === 4 ? "Breadth-First Search (BFS)" :
                                                algo === 6 ? "Greedy Best-First Search" :
                                                    algo === 7 ? "Bidirectional BFS" :
                                                        "Maze Generation"}
                            </h3>
                            <p className="text-sm text-green-700 leading-relaxed">
                                {PATH_ALGO_DESCRIPTIONS[algo]}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase">Speed (Delay ms)</label>
                    <input
                        type="number"
                        defaultValue={speed}
                        onChange={handleChangeSpeed}
                        className="bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 w-24 outline-none focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase">Mode</label>
                    <select
                        onChange={handleChangeSetBlock}
                        className="bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 outline-none focus:ring-blue-500"
                    >
                        <option value={1}>Draw Blockage</option>
                        <option value={2}>Move Start</option>
                        <option value={3}>Move End</option>
                    </select>
                </div>

                <div className="flex gap-2 ml-4">
                    <button
                        onClick={() => !isVisualizing && algoMain()}
                        disabled={isVisualizing}
                        className={`px-6 py-2 font-bold rounded-lg shadow transition-transform transform ${
                            isVisualizing 
                            ? "bg-slate-400 cursor-not-allowed opacity-75" 
                            : "bg-green-500 hover:bg-green-600 hover:-translate-y-0.5 text-white"
                        }`}
                    >
                        {isVisualizing ? "Running..." : "Visualize"}
                    </button>
                    <button
                        onClick={isVisualizing ? handleStop : resetGrid}
                        className={`px-6 py-2 font-bold rounded-lg shadow transition-transform transform ${
                            isVisualizing 
                            ? "bg-red-500 hover:bg-red-600 hover:-translate-y-0.5 text-white" 
                            : "bg-red-400 hover:bg-red-500 hover:-translate-y-0.5 text-white"
                        }`}
                    >
                        {isVisualizing ? "Stop" : "Reset"}
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 p-2 bg-slate-100 w-full border-b border-slate-200 text-xs font-medium text-slate-600 uppercase tracking-wide">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded-sm"></div> Start</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-sm"></div> End</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-700 rounded-sm"></div> Wall</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-300 rounded-sm flex items-center justify-center text-[10px] text-slate-600 font-bold">^</div> Visited</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-amber-500 rounded-sm shadow-[0_0_5px_theme('colors.amber.500')] flex items-center justify-center text-white font-bold">→</div> Path</div>
            </div>

            {/* Grid Container */}
            <div className="flex flex-col items-center justify-center w-full grow bg-slate-50 p-4">
                <div className="flex flex-col shadow-2xl border-4 border-slate-700 rounded-sm overflow-hidden w-full max-w-[90vw]" style={{ aspectRatio: '2/1' }}>
                    {Grid}
                </div>
            </div>
        </div>
    );
}
