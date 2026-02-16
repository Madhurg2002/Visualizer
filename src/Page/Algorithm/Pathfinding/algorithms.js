
// Helper for delay with abort check
const sleep = (ms, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error("Aborted"));
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error("Aborted"));
    });
});

export const Algorithms = {
    async PathFind(i, j, val, size, SleepTime, signal, direction = "") {
        await sleep(SleepTime, signal);
        const row = document.getElementById(`j-${j}`);
        if (!row) return;
        const currentNode = row.children[i];

        if (!currentNode || currentNode.className === "start") return;

        if (currentNode.className !== "end") {
            currentNode.className = `path ${direction}`;
        }

        // Logic: Trace Backwards from End -> Start.
        // If current value is val, look for neighbor with val-1.

        // Up (j-1) -> Neighbor is UP. Path came from UP. Direction: DOWN.
        if (j > 0) {
            const nodeUp = document.getElementById(`j-${j - 1}`).children[i];
            if (parseInt(nodeUp.value) === val) {
                return Algorithms.PathFind(i, j - 1, val - 1, size, SleepTime, signal, "down");
            }
        }
        // Down (j+1) -> Neighbor is DOWN. Path came from DOWN. Direction: UP.
        if (j < size - 1) {
            const nodeDown = document.getElementById(`j-${j + 1}`).children[i];
            if (parseInt(nodeDown.value) === val) {
                return Algorithms.PathFind(i, j + 1, val - 1, size, SleepTime, signal, "up");
            }
        }
        // Left (i-1) -> Neighbor is LEFT. Path came from LEFT. Direction: RIGHT.
        if (i > 0) {
            const nodeLeft = document.getElementById(`j-${j}`).children[i - 1];
            if (parseInt(nodeLeft.value) === val) {
                return Algorithms.PathFind(i - 1, j, val - 1, size, SleepTime, signal, "right");
            }
        }
        // Right (i+1) -> Neighbor is RIGHT. Path came from RIGHT. Direction: LEFT.
        // Wait, max i is 2*size.
        if (i < 2 * size - 1) {
            const nodeRight = document.getElementById(`j-${j}`).children[i + 1];
            if (parseInt(nodeRight.value) === val) {
                return Algorithms.PathFind(i + 1, j, val - 1, size, SleepTime, signal, "left");
            }
        }
    },

    async Dijkstra(size, SleepTime, signal) {
        let solved = false;

        async function settospath(i, j, value, direction) {
            if (signal?.aborted) throw new Error("Aborted");
            const row = document.getElementById(`j-${j}`);
            if (!row) return;
            const temp = row.children;
            if (temp[i].className.includes("searching-path") || temp[i].className === "blockage") return;
            
            temp[i].value = value;
            if (temp[i].className === "end") {
                solved = true;
                return;
            }
            if (temp[i].className === "empty")
                temp[i].className = `searching-path-current ${direction}`;
        }

        async function settospathmain(i, j, value) {
            if (signal?.aborted) throw new Error("Aborted");
            const row = document.getElementById(`j-${j}`);
            if (!row) return;
            const temp = row.children;
            if (temp[i].className.includes("searching-path-current") && !solved)
                temp[i].className = temp[i].className.replace("searching-path-current", "searching-path");

            // Expand neighbors
            // j-1 (Up), j+1 (Down), i-1 (Left), i+1 (Right)
            if (j > 0 && !solved) await settospath(i, j - 1, value, "up");
            if (j < size - 1 && !solved) await settospath(i, j + 1, value, "down");
            if (i > 0 && !solved) await settospath(i - 1, j, value, "left");
            if (i < 2 * size - 1 && !solved) await settospath(i + 1, j, value, "right");
        }

        // Get Start Node
        const start = document.getElementsByClassName("start")[0];
        if (!start) return false;
        
        const startI = parseInt(start.getAttribute("data-i"));
        const startJ = parseInt(start.getAttribute("data-j"));

        let index = 0;
        await settospathmain(startI, startJ, index);

        while (!solved) {
            await sleep(SleepTime, signal);
            index++;
            const searchingPaths = document.getElementsByClassName("searching-path-current");
            if (searchingPaths.length === 0) return false; // No path

            // Convert to array to avoid live collection issues during iteration?
            // getElementsByClassName returns HTMLCollection (live).
            // Iterating and modifying classes might skip elements.
            const paths = Array.from(searchingPaths);

            for (const e of paths) {
                if (parseInt(e.value) === index - 1) {
                    await settospathmain(parseInt(e.getAttribute("data-i")), parseInt(e.getAttribute("data-j")), index);
                    if (solved) return true;
                }
            }
        }
        return true;
    },

    async DFS(size, SleepTime, signal) {
        let solved = false;
        const start = document.getElementsByClassName("start")[0];
        if (!start) return false;
        const startI = parseInt(start.getAttribute("data-i"));
        const startJ = parseInt(start.getAttribute("data-j"));

        async function SetToPath(i, j, value) {
            await sleep(SleepTime, signal);
            const row = document.getElementById(`j-${j}`);
            if (!row) return;
            const temp = row.children;
            const node = temp[i];

            if (node.className === "blockage" || solved || node.className.includes("searching-path") || (value !== 0 && node.className === "start")) return;
            
            if (node.className === "end") { 
                solved = true; 
                node.value = value; 
                return;
            }

            if (!solved) {
                if (node.className === "empty") {
                    node.className = "searching-path-current";
                    node.value = value;
                } else if (node.className === "start") {
                    node.value = value;
                }
            } else {
                return;
            }

            const nextVal = value + 1;
            
            // Order: Up, Right, Down, Left? Or standard?
            // Original: Up(j-1), Right(i+1), Down(j+1), Left(i-1)
            
            if (j > 0 && !solved) await SetToPath(i, j - 1, nextVal);
            if (i < 2 * size - 1 && !solved) await SetToPath(i + 1, j, nextVal);
            if (j < size - 1 && !solved) await SetToPath(i, j + 1, nextVal);
            if (i > 0 && !solved) await SetToPath(i - 1, j, nextVal);

            if (node.className === "searching-path-current" && !solved) {
                node.className = "searching-path"; // Backtrack visual? Or visited?
                // Actually DFS usually keeps visited. 
                // "searching-path" seems to be "visited". "current" is "active recursion stack"?
            }
        }

        await SetToPath(startI, startJ, 0);
        return solved;
    },

    async BFS(size, SleepTime, signal) {
        let solved = false;
        const start = document.getElementsByClassName("start")[0];
        if (!start) return false;
        const startI = parseInt(start.getAttribute("data-i"));
        const startJ = parseInt(start.getAttribute("data-j"));

        let Queue = [];
        const visited = new Array(2 * size).fill(false).map(() => new Array(size).fill(false));

        async function pushQueue(i, j, value, direction = "") {
            if (signal?.aborted) throw new Error("Aborted");
            const row = document.getElementById(`j-${j}`);
            if (!row) return;
            const temp = row.children[i];

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

        await pushQueue(startI, startJ, 0);

        while (Queue.length > 0 && !solved) {
            await sleep(SleepTime, signal);
            const current = Queue.shift();
            const { i: ci, j: cj, value: cval } = current;

            const temp = document.getElementById(`j-${cj}`).children[ci];
            if (temp.className.includes("searching-path-current")) {
                temp.className = temp.className.replace("searching-path-current", "searching-path");
            }

            if (ci > 0) await pushQueue(ci - 1, cj, cval + 1, "left"); // Left
            if (cj > 0) await pushQueue(ci, cj - 1, cval + 1, "up"); // Up
            if (ci < 2 * size - 1) await pushQueue(ci + 1, cj, cval + 1, "right"); // Right
            if (cj < size - 1) await pushQueue(ci, cj + 1, cval + 1, "down"); // Down
        }
        return solved;
    },

    async A_Star(size, SleepTime, signal) {
        let solved = false;
        const start = document.getElementsByClassName("start")[0];
        const end = document.getElementsByClassName("end")[0];
        if (!start || !end) return false;

        const startI = parseInt(start.getAttribute("data-i"));
        const startJ = parseInt(start.getAttribute("data-j"));
        const ei = parseInt(end.getAttribute("data-i"));
        const ej = parseInt(end.getAttribute("data-j"));

        let PriorityQueue = [];
        const visited = new Array(2 * size).fill(0).map(() => new Array(size).fill(10000000));

        async function pushPQ(i, j, Gcost, value) {
            if (signal?.aborted) throw new Error("Aborted");
            const row = document.getElementById(`j-${j}`);
            if(!row) return;
            const temp = row.children[i];

            if (solved || temp.className === "blockage" || value >= visited[i][j]) return;

            if (temp.className === "end") { solved = true; temp.value = value; return; }
            
            if (!solved) {
                if (temp.className === "empty" || temp.className === "searching-path-current") {
                    temp.className = "searching-path-current";
                    temp.value = value;
                } else if (temp.className === "start") {
                    temp.value = value;
                }
            }

            var node = {
                Gcost: Gcost,
                Hcost: Math.abs(ej - j) + Math.abs(ei - i),
                Fcost: Math.abs(ei - i) + Math.abs(ej - j) + Gcost,
                i: i,
                j: j,
                value: value
            };

            // Sorted Insert
            let l = 0;
            for (l = 0; l < PriorityQueue.length; l++) {
                if (PriorityQueue[l].Fcost > node.Fcost ||
                    (PriorityQueue[l].Fcost === node.Fcost && (
                        PriorityQueue[l].Hcost > node.Hcost || (PriorityQueue[l].value > value)
                    ))) {
                    break;
                }
            }
            PriorityQueue.splice(l, 0, node);
            visited[i][j] = value;
        }

        await pushPQ(startI, startJ, 0, 0);

        while (!solved) {
            await sleep(SleepTime, signal);
            if (PriorityQueue.length === 0) return false;
            
            const current = PriorityQueue.shift();
            const { i: ci, j: cj, value: nVal, Gcost: nGcost } = current;

            // Visual: Mark as visited
            const row = document.getElementById(`j-${cj}`);
            if (row) {
                const node = row.children[ci];
                if (node.className === "searching-path-current") {
                    node.className = "searching-path";
                }
            }

            const nextG = nGcost + 1;
            const nextVal = nVal + 1;

            if (ci > 0) await pushPQ(ci - 1, cj, nextG, nextVal);
            if (cj > 0) await pushPQ(ci, cj - 1, nextG, nextVal);
            if (ci < 2 * size - 1) await pushPQ(ci + 1, cj, nextG, nextVal);
            if (cj < size - 1) await pushPQ(ci, cj + 1, nextG, nextVal);
        }
        return true;
    },

    async RecursiveDivision(r1, c1, r2, c2, orientation, size, signal) {
        if (r2 < r1 || c2 < c1) return;
        await sleep(10, signal); // Standard fast speed for generation

        // Orientation: 0 = Horizontal, 1 = Vertical
        if (orientation === 0) { // Horizontal
            let possibleRows = [];
            for (let r = r1 + 1; r <= r2 - 1; r += 2) possibleRows.push(r);
            if (possibleRows.length === 0) return; // Base case implicit?
            
            let currentRow = possibleRows[Math.floor(Math.random() * possibleRows.length)];

            let possibleCols = [];
            for (let c = c1; c <= c2; c += 2) possibleCols.push(c);
            let randomCol = possibleCols[Math.floor(Math.random() * possibleCols.length)];

            for (let c = c1; c <= c2; c++) {
                if (c !== randomCol) {
                    const row = document.getElementById(`j-${currentRow}`);
                    if (row) {
                        const node = row.children[c];
                        if (node && node.className !== "start" && node.className !== "end") {
                            node.className = "blockage";
                        }
                    }
                }
            }

            await Algorithms.RecursiveDivision(r1, c1, currentRow - 1, c2, 1, size, signal);
            await Algorithms.RecursiveDivision(currentRow + 1, c1, r2, c2, 1, size, signal);
        } else { // Vertical
            let possibleCols = [];
            for (let c = c1 + 1; c <= c2 - 1; c += 2) possibleCols.push(c);
            if (possibleCols.length === 0) return;

            let currentCol = possibleCols[Math.floor(Math.random() * possibleCols.length)];

            let possibleRows = [];
            for (let r = r1; r <= r2; r += 2) possibleRows.push(r);
            let randomRow = possibleRows[Math.floor(Math.random() * possibleRows.length)];

            for (let r = r1; r <= r2; r++) {
                if (r !== randomRow) {
                     const row = document.getElementById(`j-${r}`);
                     if (row) {
                         const node = row.children[currentCol];
                         if (node && node.className !== "start" && node.className !== "end") {
                             node.className = "blockage";
                         }
                     }
                }
            }

            await Algorithms.RecursiveDivision(r1, c1, r2, currentCol - 1, 0, size, signal);
            await Algorithms.RecursiveDivision(r1, currentCol + 1, r2, c2, 0, size, signal);
        }
    },

    async GreedyBestFirst(size, SleepTime, signal) {
        let solved = false;
        const start = document.getElementsByClassName("start")[0];
        const end = document.getElementsByClassName("end")[0];
        if (!start || !end) return false;

        const startI = parseInt(start.getAttribute("data-i"));
        const startJ = parseInt(start.getAttribute("data-j"));
        const ei = parseInt(end.getAttribute("data-i"));
        const ej = parseInt(end.getAttribute("data-j"));

        let PriorityQueue = []; // For Greedy, we sort by H cost
        const visited = new Array(2 * size).fill(false).map(() => new Array(size).fill(false));

        async function pushPQ(i, j, value) {
            if (signal?.aborted) throw new Error("Aborted");
            const row = document.getElementById(`j-${j}`);
            if (!row) return;
            const temp = row.children[i];

            if (solved || temp.className === "blockage" || visited[i][j]) return;

            if (temp.className === "end") { solved = true; temp.value = value; return; }

            if (!solved) {
                if (temp.className === "empty" || temp.className === "searching-path-current") {
                    temp.className = "searching-path-current";
                    temp.value = value;
                } else if (temp.className === "start") {
                    temp.value = value;
                }
            }

            const Hcost = Math.abs(ej - j) + Math.abs(ei - i); // Manhattan distance
            var node = {
                Hcost: Hcost,
                i: i,
                j: j,
                value: value
            };

            // Sorted Insert by Hcost
            let l = 0;
            for (l = 0; l < PriorityQueue.length; l++) {
                if (PriorityQueue[l].Hcost > node.Hcost) {
                    break;
                }
            }
            PriorityQueue.splice(l, 0, node);
            visited[i][j] = true;
        }

        await pushPQ(startI, startJ, 0);

        while (!solved) {
            await sleep(SleepTime, signal);
            if (PriorityQueue.length === 0) return false;

            const current = PriorityQueue.shift();
            const { i: ci, j: cj, value: nVal } = current;

            // Visual update
            const row = document.getElementById(`j-${cj}`);
            if (row) {
                const node = row.children[ci];
                if (node.className === "searching-path-current") {
                    node.className = "searching-path";
                }
            }

            const nextVal = nVal + 1;
            // Neighbors: Up, Left, Down, Right (or any order)
            if (ci > 0) await pushPQ(ci - 1, cj, nextVal);
            if (cj > 0) await pushPQ(ci, cj - 1, nextVal);
            if (ci < 2 * size - 1) await pushPQ(ci + 1, cj, nextVal);
            if (cj < size - 1) await pushPQ(ci, cj + 1, nextVal);
        }
        return true;
    },

    async BidirectionalBFS(size, SleepTime, signal) {
        let solved = false;
        const start = document.getElementsByClassName("start")[0];
        const end = document.getElementsByClassName("end")[0];
        if (!start || !end) return false;

        const startI = parseInt(start.getAttribute("data-i"));
        const startJ = parseInt(start.getAttribute("data-j"));
        const endI = parseInt(end.getAttribute("data-i"));
        const endJ = parseInt(end.getAttribute("data-j"));

        let queueStart = [];
        let queueEnd = [];
        // Use maps to store visited state and values (distances)
        // key: `${i},${j}` -> value: distances
        let visitedStart = new Map();
        let visitedEnd = new Map();

        async function visit(i, j, value, isStartQueue, direction = "") {
            if (signal?.aborted) throw new Error("Aborted");
            const row = document.getElementById(`j-${j}`);
            if(!row) return;
            const node = row.children[i];
            
            if (solved || node.className === "blockage") return;
            
            const key = `${i},${j}`;
            const myVisited = isStartQueue ? visitedStart : visitedEnd;
            const otherVisited = isStartQueue ? visitedEnd : visitedStart;

            if (myVisited.has(key)) return;

            // Mark visited
            myVisited.set(key, value);
            
            // Visuals
            if (node.className === "empty" || node.className.includes("searching-path")) {
                node.className = isStartQueue ? "searching-path-current" : "searching-path-current"; // distinct colors later?
                node.value = value; 
                // Note: overwriting value might be tricky if we want to trace back.
                // For simplified visualizer, we might just stop when they meet.
                // But path tracing usually relies on `value` decreasing.
                // If we overwrite, we break that. 
                // However, Bidirectional path reconstruction meets in middle.
            } else if (node.className === "start" && isStartQueue) {
                node.value = value;
            } else if (node.className === "end" && !isStartQueue) {
                node.value = value;
            }

            // Check intersection
            if (otherVisited.has(key)) {
                solved = true;
                return;
            }

            if(isStartQueue) queueStart.push({i, j, value});
            else queueEnd.push({i, j, value});
        }

        await visit(startI, startJ, 0, true);
        await visit(endI, endJ, 0, false); // End expands with 0 distance too?

        while (!solved && (queueStart.length > 0 || queueEnd.length > 0)) {
            await sleep(SleepTime, signal);
            
            // Process Start Queue
            if (queueStart.length > 0) {
                const current = queueStart.shift();
                const { i, j, value } = current;
                const node = document.getElementById(`j-${j}`).children[i];
                if(node.className === "searching-path-current") node.className = "searching-path";

                // Neighbors
                if (i > 0) await visit(i - 1, j, value + 1, true);
                if (j > 0) await visit(i, j - 1, value + 1, true);
                if (i < 2 * size - 1) await visit(i + 1, j, value + 1, true);
                if (j < size - 1) await visit(i, j + 1, value + 1, true);
            }
             
            if(solved) break;

            // Process End Queue
            if (queueEnd.length > 0) {
                 const current = queueEnd.shift();
                 const { i, j, value } = current;
                 const node = document.getElementById(`j-${j}`).children[i];
                 // Maybe use a slightly different class or color for end search?
                 if(node.className === "searching-path-current") node.className = "searching-path";

                 // Neighbors
                if (i > 0) await visit(i - 1, j, value + 1, false);
                if (j > 0) await visit(i, j - 1, value + 1, false);
                if (i < 2 * size - 1) await visit(i + 1, j, value + 1, false);
                if (j < size - 1) await visit(i, j + 1, value + 1, false);
            }
        }
        
        // Path reconstruction for Bidirectional is complex with current `PathFind` (backtracking values)
        // because both paths have increasing values from their origins.
        // The standard `PathFind` expects strict decrementing from end -> start.
        // We might need a custom bidirectional trace or just let the user see the intersection.
        // Custom trace: Trace back from intersection to Start, and intersection to End.
        
        return solved;
    }
};
