
import React, { useEffect, useState, useRef } from "react";
// import Select from "react-select"; // Removing react-select for native simpler styling or keeping if strictly needed, but let's try native first for consistent look
import "./Index.css"

// Logic variables kept global as per original design (to avoid closure issues with direct DOM helpers in original code)
var SetPoint = 1;
var AlgoNum = 1;

export default function PathFinding() {
    // Algorithm Descriptions
    const PATH_ALGO_DESCRIPTIONS = {
        1: "Dijkstra's Algorithm (Weighted): The father of pathfinding algorithms; guarantees the shortest path. It explores nodes in all directions, favoring those with lower accumulated cost.",
        2: "Depth-First Search (Unweighted): Explores as far as possible along each branch before backtracking. It is NOT guaranteed to find the shortest path and can be very inefficient for pathfinding.",
        3: "A* Search (Weighted): The gold standard for pathfinding. It uses heuristics to guide the search towards the target, making it much faster than Dijkstra while still guaranteeing the shortest path.",
        4: "Breadth-First Search (Unweighted): Explores all neighbor nodes at the present depth prior to moving on to the nodes at the next depth level. Guarantees the shortest path for unweighted graphs.",
        5: "Recursive Division (Maze Gen): A method for generating mazes. It works by recursively dividing the grid into chambers with walls, leaving gaps for passage."
    };
    const [Grid, setGrid] = useState();
    const [size, setSize] = useState(20);
    const [speed, setSpeed] = useState(500);
    // var md = false; // Moved inside to avoid issues? No, original had it global-ish or inside scope? Original had it inside component but outside functions?
    // Wait, original `var md = false` was inside component scope.
    // I'll keep ref references.

    // var md = false; 
    // using ref for md to persist without re-render
    // using ref for md to persist without re-render
    const mdRef = useRef(false);

    // START/END NODE POSITION TRACKING
    // Using refs to persist positions across re-renders without causing re-renders themselves during drag
    // Initialize with -1, will be set on first render or size change if invalid
    const startNodePos = useRef({ i: -1, j: -1 });
    const endNodePos = useRef({ i: -1, j: -1 });

    // Helper functions need to be robust. using direct DOM manipulation is risky in React but I will preserve the logic pattern to avoid full rewrite risk.

    const SleepTime = useRef(500);

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
        resetpath()
        var blocks = document.getElementsByClassName("blockage")
        Array.from(blocks).forEach(e => { e.className = "empty"; e.value = 0; })
    }

    async function handleChangeSetBlock(e) {
        // e is the event from select
        const val = parseInt(e.target.value);
        SetPoint = val;
    }

    function change(e) {
        if (e.target.className === "blockage" || e.target.className === "start" || e.target.className === "end") return
        else if (mdRef.current) {
            e.target.value = ""

            // Calculate i and j from attributes to update refs
            const currentI = parseInt(e.target.getAttribute('data-i'));
            const currentJ = parseInt(e.target.getAttribute('data-j'));

            if (SetPoint === 2) {
                const block = document.getElementsByClassName("start");
                Array.from(block).forEach(e => {
                    e.className = "empty"
                })
                e.target.className = "start";
                // Update Start Node Position
                startNodePos.current = { i: currentI, j: currentJ };

                SetPoint = 1; // Auto reset to blockage after setting start? Original didn't seem to reset definitively? Ah, `SetPoint=1` was in original.
            }
            else if (SetPoint === 3) {
                const block = document.getElementsByClassName("end");
                Array.from(block).forEach(e => {
                    e.className = "empty"
                })
                e.target.className = "end";
                // Update End Node Position
                endNodePos.current = { i: currentI, j: currentJ };

                SetPoint = 1;
            }
            else
                e.target.className = "blockage";
        }
    }

    async function algoMain() {
        resetpath()
        const start = document.getElementsByClassName("start")[0]
        if (!start) { alert("Select Start"); return; }
        const end = document.getElementsByClassName("end")[0]
        if (!end) { alert("Select End"); return; }

        var i = parseInt(start.getAttribute("data-i"))
        var j = parseInt(start.getAttribute("data-j"))
        var ei = parseInt(end.getAttribute("data-i"))
        var ej = parseInt(end.getAttribute("data-j"))
        var solved = false;

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function PathFind(i, j, val, direction = "") {
            await sleep(SleepTime.current)
            const currentNode = (document.getElementById(`j-${j}`).children)[i];

            if (currentNode.className === "start") return

            if (currentNode.className !== "end") {
                currentNode.className = `path ${direction}`;
            }

            // Logic: Trace Backwards from End -> Start. 
            // If we go to a neighbor (previous step in path), the path direction is FROM neighbor TO current.
            // Example: If neighbor is "Left" (i-1), path flows Left -> Right. Direction is "right".

            // Up (Neighbor is i-1, Left in row-major? No, i is Col.)
            // Based on layout: i=Col, j=Row.
            // i-1 is Left. Path comes from Left. Direction: Right.
            if (i > 0)
                if (parseInt((document.getElementById(`j-${j}`).children)[i - 1].value) === val) {
                    return PathFind(i - 1, j, val - 1, "right");
                }
            // Down (Neighbor is i+1, Right)
            // Path comes from Right. Direction: Left.
            if (i + 1 < 2 * size) {
                if (parseInt((document.getElementById(`j-${j}`).children)[i + 1].value) === val) {
                    return PathFind(i + 1, j, val - 1, "left");
                }
            }
            // Left (Neighbor is j-1, Up)
            // Path comes from Up. Direction: Down.
            if (j > 0) {
                if (parseInt((document.getElementById(`j-${j - 1}`).children)[i].value) === val) {
                    return PathFind(i, j - 1, val - 1, "down");
                }
            }
            // Right (Neighbor is j+1, Down)
            // Path comes from Down. Direction: Up.
            if (j + 1 < size) {
                if (parseInt((document.getElementById(`j-${j + 1}`).children)[i].value) === val) {
                    return PathFind(i, j + 1, val - 1, "up");
                }
            } return

        }

        async function Dijkstra() {
            async function settospath(i, j, value, direction) {
                const temp = document.getElementById(`j-${j}`).children
                if (temp[i].className.includes("searching-path") || temp[i].className === "blockage") return
                temp[i].value = value;
                if (temp[i].className === "end") {
                    solved = true;
                    return;
                }
                if (temp[i].className === "empty")
                    temp[i].className = `searching-path-current ${direction}`;
                return;
            }
            async function settospathmain(i, j, value) {
                const temp = document.getElementById(`j-${j}`).children;
                if (temp[i].className.includes("searching-path-current") && solved === false)
                    temp[i].className = temp[i].className.replace("searching-path-current", "searching-path");

                if (j > 0 && !solved)
                    settospath(i, j - 1, value, "left") // Moving to j-1 (Left, if j is col? No j is row. Wait layout: j=Row, i=Col)
                // Wait, earlier logic: i=Col, j=Row.
                // Left neighbor: i-1. 
                // Up neighbor: j-1.

                // Let's re-verify Layout.
                // <div key={j} id={`j-${j}`} className="board-rows">
                //    {temp} (children with id c-i-j)
                // </div>
                // So j is the ROW index (Y). i is the CHILD index (X).

                // Original code:
                // j > 0: settospath(i, j - 1, value)
                // If j is Row, j-1 is the Row ABOVE. So this is UP.
                // Wait. "Board Rows".
                // Row 0 is Top. Row 1 is Below.
                // So j-1 is UP.

                // Original code comments: "Left" for j > 0?
                // Let's check PathFind:
                // Left: j > 0 -> j-1.
                // So in this grid, j is X? i is Y?
                // Let's check Render loop:
                // for (let j = 0; j < size; j++) { ... className="board-rows" ... }
                // React renders div block-level by default.
                // So "board-rows" stack Vertically.
                // So j is Row index (Y).

                // Inside row: for(i... size*2...). buttons.
                // Flex row. So buttons stack Horizontally.
                // So i is Column index (X).

                // So:
                // j-1 = Row Above = UP.
                // j+1 = Row Below = DOWN.
                // i-1 = Col Left = LEFT.
                // i+1 = Col Right = RIGHT.

                // Original PathFind logic from previous file read:
                // // Up
                // if (i > 0) ... return PathFind(i - 1, j...
                // Wait. if i is Col, i-1 is LEFT.
                // Why did original code comment say "Up"?
                // Maybe the grid is rotated?

                // Let's trust the visual evidence I saw earlier (arrows).
                // In PathFind I mapped:
                // i-1 -> "right" (coming FROM i-1 to i. So if neighbor is left, flow is Right).
                // Wait, PathFind traces BACK from End.
                // If I am at current node, and neighbor i-1 has value-1.
                // Then step WAS i-1 -> i.
                // So flow is LEFT -> RIGHT. Direction: "right".
                // AND I labeled i>0 as "Up" in comment but logic was i-1.

                // Let's ignore comments and trust coordinate geometry.
                // j = Row (0..size). Y.
                // i = Col (0..2*size). X.

                // j-1 = UP.
                // j+1 = DOWN.
                // i-1 = LEFT.
                // i+1 = RIGHT.

                if (j > 0 && !solved)
                    settospath(i, j - 1, value, "up")
                if (j < size - 1 && !solved)
                    settospath(i, j + 1, value, "down")
                if (i > 0 && !solved)
                    settospath(i - 1, j, value, "left")
                if (i < (2 * size) - 1 && !solved)
                    settospath(i + 1, j, value, "right")
            }
            var index = 0;
            settospathmain(i, j, index)
            while (solved === false) {
                await sleep(SleepTime.current)
                index++;
                const SeacrhPath = document.getElementsByClassName("searching-path-current");
                if (SeacrhPath.length === 0) { alert("No Path"); return; }
                for (const e of SeacrhPath) {
                    if (parseInt(e.value) === index - 1) {
                        settospathmain(parseInt(e.getAttribute("data-i")), parseInt(e.getAttribute("data-j")), index);
                    }
                }
            }
        }

        async function DFS() {
            async function SetToPath(i, j, value) {
                await sleep(SleepTime.current)
                const temp = document.getElementById(`j-${j}`).children;
                if (temp[i].className === "blockage" || solved || temp[i].className === "searching-path-current" || temp[i].className === "searching-path" || (value !== 0 && temp[i].className === "start")) return;
                if (temp[i].className === "end") { solved = true; temp[i].value = value; }
                if (!solved) {
                    if (temp[i].className === "empty") {
                        temp[i].className = "searching-path-current";
                        temp[i].value = value;
                    }
                    else if (temp[i].className === "start") {
                        temp[i].value = value;
                    }
                }
                else
                    return;
                value++;
                if (j > 0 && !solved) {
                    await SetToPath(i, j - 1, value)
                }
                if (i < (2 * size) - 1 && !solved) {
                    await SetToPath(i + 1, j, value)
                }
                if (j < size - 1 && !solved) {
                    await SetToPath(i, j + 1, value)
                }
                if (i > 0 && !solved) {
                    await SetToPath(i - 1, j, value)
                }
                if (temp[i].className === "searching-path-current" && solved === false) {
                    temp[i].className = "searching-path";
                }
            }
            await SetToPath(i, j, 0);
            if (!solved) alert("no path")
        }

        async function BFS() {
            var Queue = [];
            const visited = new Array(2 * size).fill(false).map(() => new Array(size).fill(false));

            async function pushQueue(i, j, value, direction = "") {
                const temp = (document.getElementById(`j-${j}`).children)[i];
                if (solved || temp.className === "blockage" || visited[i][j]) return;

                if (temp.className === "end") { solved = true; temp.value = value; return; }

                if (temp.className === "empty" || temp.className.includes("searching-path-current")) {
                    temp.className = `searching-path-current ${direction}`;
                    temp.value = value;
                } else if (temp.className === "start") {
                    temp.value = value;
                }

                visited[i][j] = true;
                Queue.push({ i, j, value });
            }

            pushQueue(i, j, 0);

            while (Queue.length > 0 && !solved) {
                await sleep(SleepTime.current);
                const current = Queue.shift();
                const { i: ci, j: cj, value: cval } = current;

                // Color processed node - preserve direction?
                // The DOM node currently has "searching-path-current [direction]"
                const temp = (document.getElementById(`j-${cj}`).children)[ci];
                if (temp.className.includes("searching-path-current")) {
                    temp.className = temp.className.replace("searching-path-current", "searching-path");
                }

                // j = Row (Y), i = Col (X)
                // i - 1 = Left
                // j - 1 = Up

                if (ci > 0) await pushQueue(ci - 1, cj, cval + 1, "left");
                if (cj > 0) await pushQueue(ci, cj - 1, cval + 1, "up");
                if (ci < 2 * size - 1) await pushQueue(ci + 1, cj, cval + 1, "right");
                if (cj < size - 1) await pushQueue(ci, cj + 1, cval + 1, "down");
            }
        }

        async function RecursiveDivision(r1, c1, r2, c2, orientation) {
            if (r2 < r1 || c2 < c1) return;
            await sleep(10);

            // Orientation: 0 = Horizontal, 1 = Vertical
            if (orientation === 0) { // Horizontal
                // Choose a random row
                let possibleRows = [];
                for (let r = r1 + 1; r <= r2 - 1; r += 2) possibleRows.push(r);
                let currentRow = possibleRows[Math.floor(Math.random() * possibleRows.length)];

                // Choose a random hole
                let possibleCols = [];
                for (let c = c1; c <= c2; c += 2) possibleCols.push(c);
                let randomCol = possibleCols[Math.floor(Math.random() * possibleCols.length)];

                if (!currentRow) return;

                for (let c = c1; c <= c2; c++) {
                    if (c !== randomCol) {
                        const node = (document.getElementById(`j-${currentRow}`).children)[c];
                        if (node.className !== "start" && node.className !== "end") {
                            node.className = "blockage";
                        }
                    }
                }

                await RecursiveDivision(r1, c1, currentRow - 1, c2, 1);
                await RecursiveDivision(currentRow + 1, c1, r2, c2, 1);
            } else { // Vertical
                let possibleCols = [];
                for (let c = c1 + 1; c <= c2 - 1; c += 2) possibleCols.push(c);
                let currentCol = possibleCols[Math.floor(Math.random() * possibleCols.length)];

                let possibleRows = [];
                for (let r = r1; r <= r2; r += 2) possibleRows.push(r);
                let randomRow = possibleRows[Math.floor(Math.random() * possibleRows.length)];

                if (!currentCol) return;

                for (let r = r1; r <= r2; r++) {
                    if (r !== randomRow) {
                        // Careful: j is row (0..size), i is col (0..2*size) in original layout??
                        // Wait, original: j is OUTSIDE loop (0..size) -> Rows?
                        // i is INSIDE loop (0..2*size) -> Columns?
                        // "board-rows" divs are j, children are i.
                        // So j is Row Index, i is Col Index?
                        // document.getElementById(`j-${j}`).children)[i]
                        // j = 0..size (Rows), i = 0..2*size (Cols)

                        // My RecursiveDivision args: r=Row(j), c=Col(i)
                        // node = j-{r}.children[c]


                        // Actually: j is the row container ID. i is the button index in that row.
                        // So: j is Y (row), i is X (col). 

                        // Logic check:
                        // r goes from r1 to r2 (Rows/j)
                        // currentCol is the Column/i to block

                        const rowElem = document.getElementById(`j-${r}`); // Row j
                        if (rowElem && rowElem.children[currentCol]) {
                            const node = rowElem.children[currentCol];
                            if (node.className !== "start" && node.className !== "end") {
                                node.className = "blockage";
                            }
                        }
                    }
                }
                await RecursiveDivision(r1, c1, r2, currentCol - 1, 0);
                await RecursiveDivision(r1, currentCol + 1, r2, c2, 0);
            }
        }

        async function A_Star() {
            var PriorityQueue = [];
            const visited = new Array(2 * size).fill(0).map(() => new Array(size).fill(10000000));
            async function pushPQ(i, j, Gcost, value) {
                const temp = (document.getElementById(`j-${j}`).children)[i];
                if (
                    solved
                    || temp.className === "blockage"
                    || (value >= visited[i][j])
                ) return;

                if (temp.className === "end") { solved = true; temp.value = value; return }
                if (!solved) {
                    if (temp.className === "empty" || temp.className === "searching-path-current") {
                        temp.className = "searching-path-current";
                        temp.value = value;
                    }
                    else if (temp.className === "start")
                        temp.value = value;
                }
                var node = {
                    Gcost: Gcost,
                    Hcost: Math.abs(ej - j) + Math.abs(ei - i),
                    Fcost: Math.abs(ei - i) + Math.abs(ej - j) + Gcost,
                    i: i,
                    j: j,
                    value: value
                };
                let l = 0;
                // Priority Queue Insertion
                for (l = 0; l < PriorityQueue.length; l++)
                    if (PriorityQueue[l].Fcost > node.Fcost ||
                        (PriorityQueue[l].Fcost === node.Fcost && (
                            PriorityQueue[l].Hcost > node.Hcost || (PriorityQueue[l].value > value)
                        )))
                        break;
                PriorityQueue = [...PriorityQueue.slice(0, Math.max(l, 0)), node, ...PriorityQueue.slice(Math.max(l, 0))];
                visited[i][j] = value;
            }
            pushPQ(i, j, 0, 0);
            while (solved === false) {
                await sleep(SleepTime.current);
                if (PriorityQueue.length === 0) { alert("No Path"); return; }
                var nGcost = PriorityQueue[0].Gcost + 1, ni = PriorityQueue[0].i, nj = PriorityQueue[0].j, value = PriorityQueue[0].value + 1;
                PriorityQueue = [...PriorityQueue.slice(1)];
                if (ni > 0) await pushPQ(ni - 1, nj, nGcost, value);
                if (nj > 0) await pushPQ(ni, nj - 1, nGcost, value);
                if (ni < 2 * size - 1) await pushPQ(ni + 1, nj, nGcost, value);
                if (nj < size - 1) await pushPQ(ni, nj + 1, nGcost, value);
            }
        }

        switch (AlgoNum) {
            case 1:
                console.log("Dijkstra");
                await Dijkstra();
                break;
            case 2:
                console.log("DFS");
                await DFS();
                break;
            case 3:
                console.log("A*");
                await A_Star();
                break;
            case 4:
                console.log("BFS");
                await BFS();
                break;
            case 5:
                resetGrid();
                // r is j (0 to size-1), c is i (0 to 2*size -1)
                await RecursiveDivision(0, 0, size - 1, (2 * size) - 1, 1);
                return; // Maze generation doesn't solve path
            default:
                await Dijkstra();
                break;
        }
        if (solved) PathFind(ei, ej, parseInt(end.value) - 1);
    }

    const [algo, setAlgo] = useState(1);
    const [showDesc, setShowDesc] = useState(false);

    function handleChangeAlgorithm(e) {
        const val = parseInt(e.target.value);
        AlgoNum = val;
        setAlgo(val);
    }

    function handleChangeSpeed(e) {
        setSpeed(e.target.value);
        SleepTime.current = e.target.value;
    }

    // Grid Generation Effect
    useEffect(() => {
        var temp2 = [];
        // The original logic creates a grid of size x (size*2)
        // Rows are indexed by j (0 to size)
        // Columns are indexed by i (0 to size*2)

        // Caution: Original logic structure:
        // Divs are Columns? "board-rows"
        // Let's stick to original loop structure

        // Determine Start/End positions
        // If refs are unset (-1) or out of bounds for NEW size, reset to defaults.
        // Otherwise use ref values.

        let sI = startNodePos.current.i;
        let sJ = startNodePos.current.j;
        let eI = endNodePos.current.i;
        let eJ = endNodePos.current.j;

        // Defaults
        const defaultStartI = Math.floor(size / 4);
        const defaultStartJ = Math.floor(size / 2);
        const defaultEndI = Math.floor(7 * size / 4);
        const defaultEndJ = Math.floor(size / 2);

        // Validation bounds: 0 <= i < size*2, 0 <= j < size
        const isValid = (i, j) => i >= 0 && i < size * 2 && j >= 0 && j < size;

        if (!isValid(sI, sJ)) { sI = defaultStartI; sJ = defaultStartJ; startNodePos.current = { i: sI, j: sJ }; }
        if (!isValid(eI, eJ)) { eI = defaultEndI; eJ = defaultEndJ; endNodePos.current = { i: eI, j: eJ }; }

        const startCoords = { i: sI, j: sJ };
        const endCoords = { i: eI, j: eJ };

        for (let j = 0; j < size; j++) {
            // Create elements for this row
            var temp = [];
            for (let i = 0; i < size * 2; i++) {
                let className = "empty";

                // Default positions logic - run only if refs are invalid or need reset?
                // Actually, best approach: Use refs if valid for current size. If not, recalculate defaults.

                // Current logic: Hardcoded.
                // New logic: Check refs.

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size]); // Re-render when size changes

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
                        className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                        onClick={() => algoMain()}
                        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow transition-transform transform hover:-translate-y-0.5"
                    >
                        Visualize
                    </button>
                    <button
                        onClick={resetGrid}
                        className="px-6 py-2 bg-red-400 hover:bg-red-500 text-white font-bold rounded-lg shadow transition-transform transform hover:-translate-y-0.5"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Description */}
            {/* Description Removed from here - moved to hover tooltip */}

            {/* Legend */}
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 p-2 bg-slate-100 w-full border-b border-slate-200 text-xs font-medium text-slate-600 uppercase tracking-wide">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded-sm"></div> Start</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-sm"></div> End</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-700 rounded-sm"></div> Wall</div>
                {/* Visited: searching-path is bg-blue-300 (#93c5fd). searching-path-current is bg-blue-500. Legend said blue-300 before. */}
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
