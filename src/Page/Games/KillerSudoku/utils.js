// Killer Sudoku engine — self-contained (no imports from the classic Sudoku page).
//
// A proper Killer Sudoku has NO given digits: the dashed cages with their sums are
// the only clues. This module generates a full solution grid (seeded, deterministic),
// grows a fine cage cover over it, then reaches a UNIQUE cage-only puzzle by merging
// cages along the differing cells of two competing solutions (see generateKillerPuzzle).
// Difficulty coarsens cages with uniqueness-preserving merges; revealed givens are a
// rare last-resort safety net. All randomness is threaded through the seed.

export const size = 3;
export const N = 9;

export function randomSeed(len = 8) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let res = "";
    for (let i = 0; i < len; i++) res += chars[Math.floor(Math.random() * chars.length)];
    return res;
}

export function createSeededRNG(seed) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return function () {
        h += h << 13;
        h ^= h >>> 7;
        h += h << 3;
        h ^= h >>> 17;
        h += h << 5;
        return (h >>> 0) / 4294967296;
    };
}

export function shuffle(arr, rand) {
    const array = arr.slice();
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function isValid(board, r, c, n) {
    for (let i = 0; i < N; i++) {
        if (board[r][i] === n || board[i][c] === n) return false;
    }
    const br = r - (r % size), bc = c - (c % size);
    for (let i = br; i < br + size; i++)
        for (let j = bc; j < bc + size; j++)
            if (board[i][j] === n) return false;
    return true;
}

export function generateFull(seed) {
    const rand = createSeededRNG(seed);
    const board = Array(N).fill(0).map(() => Array(N).fill(0));
    function fill(r = 0, c = 0) {
        if (r === N) return true;
        const nr = c === N - 1 ? r + 1 : r;
        const nc = c === N - 1 ? 0 : c + 1;
        for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand)) {
            if (isValid(board, r, c, n)) {
                board[r][c] = n;
                if (fill(nr, nc)) return true;
                board[r][c] = 0;
            }
        }
        return false;
    }
    fill();
    return board;
}

export function isComplete(user, sol) {
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
            if (user[r][c] !== sol[r][c]) return false;
    return true;
}

/** cageIdOf[r][c] -> cage index (or -1). */
export function buildCageIdOf(cages) {
    const map = Array.from({ length: N }, () => Array(N).fill(-1));
    cages.forEach((cage, id) => cage.cells.forEach(([r, c]) => { map[r][c] = id; }));
    return map;
}

/* ----------------------------- Cage generation ----------------------------- */

/**
 * Grow connected cages over the solution grid. Cages are 4-connected, contain
 * no repeated digits, and together cover the whole board. Sums come from the
 * solution, so they are always correct by construction.
 */
export function growCages(seed, avgSize, solution) {
    const rand = createSeededRNG(seed + "-killer");
    const starts = shuffle(
        Array.from({ length: N * N }, (_, i) => [Math.floor(i / N), i % N]),
        rand
    );

    const cageId = Array.from({ length: N }, () => Array(N).fill(-1));
    const cages = [];
    const digitSeen = (cells, digit) => cells.some(([r, c]) => solution[r][c] === digit);

    const growFrom = (sr, sc, maxCells) => {
        const cells = [[sr, sc]];
        cageId[sr][sc] = cages.length;
        while (cells.length < maxCells) {
            const candidates = [];
            for (const [r, c] of cells) {
                for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
                    if (cageId[nr][nc] !== -1) continue;
                    if (digitSeen(cells, solution[nr][nc])) continue;
                    candidates.push([nr, nc]);
                }
            }
            if (candidates.length === 0) break;
            const [nr, nc] = candidates[Math.floor(rand() * candidates.length)];
            cageId[nr][nc] = cages.length;
            cells.push([nr, nc]);
        }
        cages.push(cells);
    };

    for (const [sr, sc] of starts) {
        if (cageId[sr][sc] !== -1) continue;
        const jitter = Math.round((rand() * 2 - 1) * 1.2);
        growFrom(sr, sc, Math.min(5, Math.max(2, Math.round(avgSize) + jitter)));
    }

    // No size-1 cages (a 1-cell cage reveals its digit): merge them into a
    // duplicate-free orthogonal neighbour when possible.
    for (let i = 0; i < cages.length; i++) {
        if (cages[i].length !== 1) continue;
        const [r, c] = cages[i][0];
        for (const [dr, dc] of shuffle([[-1, 0], [1, 0], [0, -1], [0, 1]], rand)) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
            const nid = cageId[nr][nc];
            if (nid === -1 || nid === i || cages[nid].length >= 5) continue;
            if (digitSeen(cages[nid], solution[r][c])) continue;
            cageId[r][c] = nid;
            cages[nid].push([r, c]);
            cages[i] = null;
            break;
        }
    }
    const finalCages = cages.filter(Boolean);

    return finalizeCages(finalCages, solution);
}

function finalizeCages(cellLists, solution) {
    return cellLists.map((cells, id) => ({
        id,
        cells,
        sum: cells.reduce((acc, [r, c]) => acc + solution[r][c], 0),
        topLeft: cells.reduce(
            (min, cell) => (cell[0] * N + cell[1] < min[0] * N + min[1] ? cell : min),
            cells[0]
        ),
    }));
}

/* ------------------------------ Killer solver ------------------------------ */
/* Backtracking with MRV cell selection and cage pruning (digit-duplicates,
   remaining-sum bounds). Counts solutions up to `limit`; returns Infinity if
   the node budget is exhausted (treated as "not proven unique"). */

export function solveKillerCount(cages, limit = 2, nodeCap = 90000, givenDigits = null) {
    const cageIdOf = buildCageIdOf(cages);
    const cageInfo = cages.map((cg) => ({
        used: 0,    // bitmask of digits placed in this cage
        placed: 0,  // sum of digits placed
        remaining: cg.cells.length,
        target: cg.sum,
    }));

    const grid = Array.from({ length: N }, () => Array(N).fill(0));
    const rows = Array(N).fill(0);
    const cols = Array(N).fill(0);
    const boxes = Array(N).fill(0);
    const bitsOf = (n) => 1 << n;

    let count = 0;

    // Pre-place revealed givens ("r-c" -> digit) so they constrain the count.
    // Without this, revealed cells would not reduce the number of solutions and
    // the uniqueness loop in generateKillerPuzzle could never converge.
    if (givenDigits) {
        for (const key of Object.keys(givenDigits)) {
            const [r, c] = key.split("-").map(Number);
            if (Number.isFinite(r) && Number.isFinite(c) && givenDigits[key] >= 1 && givenDigits[key] <= 9) {
                place(r, c, givenDigits[key]);
            }
        }
    }
    let nodes = 0;
    let aborted = false;

    /** Digits still placeable in `cell` under all constraints (bitmask).
     *  Allocation-free: min/max rest sums are computed with arithmetic on the
     *  digit bitmasks instead of building + sorting arrays (this runs per node
     *  per empty cell, so constant factors matter a lot). */
    function candidates(r, c) {
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const cid = cageIdOf[r][c];
        const cage = cageInfo[cid];
        let mask = 0;
        const blocked = rows[r] | cols[c] | boxes[b] | (cid >= 0 ? cage.used : 0);
        if (cid < 0) {
            return ~blocked & 0x3FE; // digits 1..9 not blocked
        }
        const k = cage.remaining - 1;               // cells left after this one
        const target = cage.target - cage.placed;   // sum still needed
        // Digit totals lookup for min/max rest computations.
        for (let d = 1; d <= 9; d++) {
            if (blocked & bitsOf(d)) continue;
            if (k < 0) continue;                    // cage already overfull
            if (k === 0) {
                if (target !== d) continue;         // last cell must hit the sum
            } else {
                // Remaining cells (excluding d): the k smallest/largest digits still
                // unused anywhere in the cage. NOTE: only cage.used restricts the pool —
                // row/col/box of THIS cell says nothing about other cage cells.
                let restMask = 0;
                for (let v = 1; v <= 9; v++) {
                    if (v !== d && !(cage.used & bitsOf(v))) restMask |= bitsOf(v);
                }
                if (popcount(restMask) < k) continue;
                // min sum: take smallest k set bits; max sum: take largest k set bits.
                let minRest = 0, maxRest = 0, takenMin = 0, takenMax = 0;
                for (let v = 1; v <= 9 && (takenMin < k || takenMax < k); v++) {
                    if (restMask & bitsOf(v)) {
                        if (takenMin < k) { minRest += v; takenMin++; }
                    }
                    const vHi = 10 - v;
                    if (restMask & bitsOf(vHi)) {
                        if (takenMax < k) { maxRest += vHi; takenMax++; }
                    }
                }
                if (d + minRest > target || d + maxRest < target) continue;
            }
            mask |= bitsOf(d);
        }
        return mask;
    }

    function place(r, c, d) {
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const cid = cageIdOf[r][c];
        grid[r][c] = d;
        rows[r] |= bitsOf(d); cols[c] |= bitsOf(d); boxes[b] |= bitsOf(d);
        if (cid >= 0) {
            cageInfo[cid].used |= bitsOf(d);
            cageInfo[cid].placed += d;
            cageInfo[cid].remaining -= 1;
        }
    }

    function unplace(r, c, d) {
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const cid = cageIdOf[r][c];
        grid[r][c] = 0;
        rows[r] &= ~bitsOf(d); cols[c] &= ~bitsOf(d); boxes[b] &= ~bitsOf(d);
        if (cid >= 0) {
            cageInfo[cid].used &= ~bitsOf(d);
            cageInfo[cid].placed -= d;
            cageInfo[cid].remaining += 1;
        }
    }

    function dfs() {
        if (aborted) return;
        if (nodes++ > nodeCap) { aborted = true; return; }

        // MRV: pick the empty cell with fewest candidates.
        let bestR = -1, bestC = -1, bestMask = 0, bestCount = 10;
        for (let r = 0; r < N && bestCount > 1; r++) {
            for (let c = 0; c < N && bestCount > 1; c++) {
                if (grid[r][c] !== 0) continue;
                const mask = candidates(r, c);
                const cnt = popcount(mask);
                if (cnt === 0) return;          // dead end
                if (cnt < bestCount) {
                    bestCount = cnt; bestR = r; bestC = c; bestMask = mask;
                }
            }
        }
        if (bestR === -1) { count++; return; }  // full grid — a solution

        for (let d = 1; d <= 9; d++) {
            if (!(bestMask & bitsOf(d))) continue;
            place(bestR, bestC, d);
            dfs();
            unplace(bestR, bestC, d);
            if (count >= limit || aborted) return;
        }
    }

    dfs();
    return aborted ? Infinity : count;
}

/**
 * Find up to `limit` actual solutions (grids) of the cage puzzle.
 * Returns { solutions: number[][][], aborted } — aborted=true means the node
 * budget ran out before the search space was exhausted (results are partial).
 */
export function solveKillerCollect(cages, limit = 2, nodeCap = 60000, givenDigits = null) {
    const cageIdOf = buildCageIdOf(cages);
    const cageInfo = cages.map((cg) => ({
        used: 0, placed: 0, remaining: cg.cells.length, target: cg.sum,
    }));
    const grid = Array.from({ length: N }, () => Array(N).fill(0));
    const rows = Array(N).fill(0);
    const cols = Array(N).fill(0);
    const boxes = Array(N).fill(0);
    const bitsOf = (n) => 1 << n;

    const solutions = [];
    let nodes = 0;
    let aborted = false;

    if (givenDigits) {
        for (const key of Object.keys(givenDigits)) {
            const [r, c] = key.split("-").map(Number);
            if (Number.isFinite(r) && Number.isFinite(c)) place(r, c, givenDigits[key]);
        }
    }

    function candidates(r, c) {
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const cid = cageIdOf[r][c];
        const cage = cageInfo[cid];
        const blocked = rows[r] | cols[c] | boxes[b] | (cid >= 0 ? cage.used : 0);
        if (cid < 0) return ~blocked & 0x3FE;
        const k = cage.remaining - 1;
        const target = cage.target - cage.placed;
        let mask = 0;
        for (let d = 1; d <= 9; d++) {
            if (blocked & bitsOf(d)) continue;
            if (k === 0) {
                if (target !== d) continue;
            } else {
                let restMask = 0;
                for (let v = 1; v <= 9; v++) {
                    if (v !== d && !(cage.used & bitsOf(v))) restMask |= bitsOf(v);
                }
                if (popcount(restMask) < k) continue;
                let minRest = 0, maxRest = 0, takenMin = 0, takenMax = 0;
                for (let v = 1; v <= 9 && (takenMin < k || takenMax < k); v++) {
                    if (restMask & bitsOf(v)) {
            			if (takenMin < k) { minRest += v; takenMin++; }
                    }
                    const vHi = 10 - v;
                    if (restMask & bitsOf(vHi)) {
                        if (takenMax < k) { maxRest += vHi; takenMax++; }
                    }
                }
                if (d + minRest > target || d + maxRest < target) continue;
            }
            mask |= bitsOf(d);
        }
        return mask;
    }

    function place(r, c, d) {
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const cid = cageIdOf[r][c];
        grid[r][c] = d;
        rows[r] |= bitsOf(d); cols[c] |= bitsOf(d); boxes[b] |= bitsOf(d);
        if (cid >= 0) {
            cageInfo[cid].used |= bitsOf(d);
            cageInfo[cid].placed += d;
            cageInfo[cid].remaining -= 1;
        }
    }
    function unplace(r, c, d) {
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const cid = cageIdOf[r][c];
        grid[r][c] = 0;
        rows[r] &= ~bitsOf(d); cols[c] &= ~bitsOf(d); boxes[b] &= ~bitsOf(d);
        if (cid >= 0) {
            cageInfo[cid].used &= ~bitsOf(d);
            cageInfo[cid].placed -= d;
            cageInfo[cid].remaining += 1;
        }
    }

    function dfs() {
        if (aborted) return;
        if (nodes++ > nodeCap) { aborted = true; return; }
        let bestR = -1, bestC = -1, bestMask = 0, bestCount = 10;
        for (let r = 0; r < N && bestCount > 1; r++) {
            for (let c = 0; c < N && bestCount > 1; c++) {
                if (grid[r][c] !== 0) continue;
                const mask = candidates(r, c);
                const cnt = popcount(mask);
                if (cnt === 0) return;
                if (cnt < bestCount) { bestCount = cnt; bestR = r; bestC = c; bestMask = mask; }
            }
        }
        if (bestR === -1) {
            solutions.push(grid.map((row) => row.slice()));
            return;
        }
        for (let d = 1; d <= 9; d++) {
            if (!(bestMask & bitsOf(d))) continue;
            place(bestR, bestC, d);
            dfs();
            unplace(bestR, bestC, d);
            if (solutions.length >= limit || aborted) return;
        }
    }

    dfs();
    return { solutions, aborted };
}

function popcount(x) {
    let n = 0;
    while (x) { x &= x - 1; n++; }
    return n;
}

/** Adjacent cage pairs (ia<ib) whose union stays duplicate-free and ≤ maxSize cells. */
function listMergePairs(cages, solution, maxSize = 6) {
    const cageIdOf = buildCageIdOf(cages);
    const pairs = [];
    for (let idA = 0; idA < cages.length; idA++) {
        for (let idB = idA + 1; idB < cages.length; idB++) {
            const a = cages[idA], b = cages[idB];
            if (a.cells.length + b.cells.length > maxSize) continue;
            let adjacent = false;
            for (const [r, c] of a.cells) {
                for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
                    if (cageIdOf[nr][nc] === idB) { adjacent = true; break; }
                }
                if (adjacent) break;
            }
            if (!adjacent) continue;
            const digits = new Set();
            let ok = true;
            for (const [r, c] of [...a.cells, ...b.cells]) {
                const d = solution[r][c];
                if (digits.has(d)) { ok = false; break; }
                digits.add(d);
            }
            if (ok) pairs.push([idA, idB]);
        }
    }
    return pairs;
}

/* --------------------------- Puzzle orchestration -------------------------- */

/**
 * Generate a unique killer puzzle deterministically from a seed.
 * Returns { cages, solution, givens } — givens is a Set of "r-c" keys. Good
 * generation merges cages until the cage-only puzzle is provably unique, so
 * givens is usually empty; a few reveals appear only when merging exhausts.
 *
 * Strategy:
 *   1. Grow a FINE cage cover (mostly 2-cell cages).
 *   2. Solve for two competing solutions; merge cages that contain differing
 *      cells of the two — this directly targets the ambiguity instead of
 *      merging blindly. Repeat until only one solution remains.
 *   3. Coarsen for difficulty with uniqueness-preserving merges.
 *   4. Safety net: reveal givens (solver-fed) if uniqueness is still unproven.
 */
export function generateKillerPuzzle(seed, difficulty) {
    // Synchronous fast path used by tests/scripts; the UI awaits the chunked
    // async variant below so the spinner can paint between solver rounds.
    return generateKillerPuzzleSync(seed, difficulty);
}

const yieldToBrowser = () =>
    new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Same algorithm as generateKillerPuzzleSync, but yields to the event loop
 * between solver rounds (each individual round stays synchronous — bounded by
 * the node budget — so one frame never blocks for more than a few hundred ms).
 * Deterministic: yields never touch the seeded RNG or any game state.
 */
export async function generateKillerPuzzleAsync(seed, difficulty, { onProgress } = {}) {
    const rand = createSeededRNG(seed + "-killer-gen");
    const solution = generateFull(seed);

    const probeCap = 40000;    // per-solve node budget (stays responsive)
    const confirmCap = 60000;  // larger budget to confirm the final count

    // 1) Fine cover.
    let cages = growCages(seed, 1.8, solution);

    // 2) Ambiguity-targeted merging until unique (or until the solver can no
    //    longer find 2 concrete solutions within budget). Merge union size
    //    escalates when merges stop shrinking the ambiguity.
    let merges = 0;
    let collectCap = probeCap;
    let maxSize = 6;
    let lastDiffering = Infinity;
    while (merges < 80) {
        const { solutions, aborted } = solveKillerCollect(cages, 2, collectCap);
        if (!aborted && solutions.length === 1) break;      // provably unique
        if (solutions.length >= 2) {
            collectCap = probeCap;                          // confirmed ambiguity: reset
            const a = solutions[0], b = solutions[1];
            const differing = [];
            for (let r = 0; r < N; r++)
                for (let c = 0; c < N; c++)
                    if (a[r][c] !== b[r][c]) differing.push([r, c]);

            // Stall detection: if the ambiguity isn't shrinking, allow bigger
            // cage unions so a single merge can cover more differing cells.
            if (differing.length >= lastDiffering) maxSize = Math.min(9, maxSize + 2);
            lastDiffering = differing.length;

            const next = mergeAlongCells(cages, solution, rand, differing, maxSize);
            if (!next) break;
            cages = next;
            merges++;
            if (onProgress) onProgress({ stage: "merging", merges });
            await yieldToBrowser();
            continue;
        }
        // Aborted with <2 solutions: escalate budget; if the escalation still
        // can't decide, do ONE full-budget targeted merge before giving up.
        if (collectCap < probeCap * 4) {
            collectCap *= 2;
            await yieldToBrowser();
            continue;
        }
        const bigPass = solveKillerCollect(cages, 2, confirmCap);
        if (bigPass.solutions.length >= 2) {
            const a = bigPass.solutions[0], b = bigPass.solutions[1];
            const differing = [];
            for (let r = 0; r < N; r++)
                for (let c = 0; c < N; c++)
                    if (a[r][c] !== b[r][c]) differing.push([r, c]);
            const next = mergeAlongCells(cages, solution, rand, differing, 9);
            if (!next) break;
            cages = next;
            merges++;
        } else {
            break; // couldn't find 2 solutions even at full budget — hand off
        }
        collectCap = probeCap;
        await yieldToBrowser();
    }

    // 3) Coarsen while uniqueness is preserved (difficulty = how far we go).
    const coarsenBudget = COARSEN_MERGES[difficulty] ?? COARSEN_MERGES.medium;
    let coarsened = 0;
    while (coarsened < coarsenBudget) {
        const best = pickBestMerge(cages, solution, rand, probeCap, true);
        if (!best) break;
        cages = best.cages;
        coarsened++;
        if (onProgress) onProgress({ stage: "coarsening", coarsened });
        await yieldToBrowser();
    }

    // 4) Confirmation with targeted reveals. If the collector finds two
    //    solutions, revealing one cell where they differ provably eliminates
    //    one of them — far more effective than blind reveals. If the solver
    //    merely aborts (unknown), reveal any cell to shrink the search space.
    const givens = new Set();
    const givenDigits = {};
    let collectCap2 = probeCap;
    for (let round = 0; round < 24; round++) {
        const { solutions, aborted } = solveKillerCollect(cages, 2, collectCap2, givenDigits);
        if (!aborted && solutions.length === 1) break;      // provably unique

        let revealCell = null;
        if (solutions.length >= 2) {
            collectCap2 = probeCap;
            const a = solutions[0], b = solutions[1];
            for (let r = 0; r < N && !revealCell; r++)
                for (let c = 0; c < N; c++)
                    if (a[r][c] !== b[r][c]) { revealCell = [r, c]; break; }
        }
        if (!revealCell) {
            // Aborted/unknown: escalate budget a bit; if still unknown, blind-reveal.
            if (collectCap2 < probeCap * 2) {
                collectCap2 *= 2;
                round--;                                    // escalation is free
                await yieldToBrowser();
                continue;
            }
            collectCap2 = probeCap;
            const openCells = [];
            for (let r = 0; r < N; r++)
                for (let c = 0; c < N; c++)
                    if (!givens.has(`${r}-${c}`)) openCells.push([r, c]);
            if (openCells.length === 0) break;
            revealCell = openCells[Math.floor(rand() * openCells.length)];
        }
        givens.add(`${revealCell[0]}-${revealCell[1]}`);
        givenDigits[`${revealCell[0]}-${revealCell[1]}`] = solution[revealCell[0]][revealCell[1]];
        if (onProgress) onProgress({ stage: "revealing", givens: givens.size });
        await yieldToBrowser();
    }

    return { cages, solution, givens };
}

function generateKillerPuzzleSync(seed, difficulty) {
    const rand = createSeededRNG(seed + "-killer-gen");
    const solution = generateFull(seed);

    const probeCap = 40000;    // per-solve node budget (stays responsive)
    const confirmCap = 60000; // larger budget to confirm the final count

    // 1) Fine cover.
    let cages = growCages(seed, 1.8, solution);

    // 2) Ambiguity-targeted merging until unique (or until the solver can no
    //    longer find 2 concrete solutions within budget). Merge union size
    //    escalates when merges stop shrinking the ambiguity. A final fallback
    //    pass with maxSize=9 usually finishes the last stubborn ambiguities.
    let merges = 0;
    let collectCap = probeCap;
    let maxSize = 6;
    let lastDiffering = Infinity;
    while (merges < 80) {
        const { solutions, aborted } = solveKillerCollect(cages, 2, collectCap);
        if (!aborted && solutions.length === 1) break;      // provably unique
        if (solutions.length >= 2) {
            collectCap = probeCap;                          // confirmed ambiguity: reset
            const a = solutions[0], b = solutions[1];
            const differing = [];
            for (let r = 0; r < N; r++)
                for (let c = 0; c < N; c++)
                    if (a[r][c] !== b[r][c]) differing.push([r, c]);

            // Stall detection: if the ambiguity isn't shrinking, allow bigger
            // cage unions so a single merge can cover more differing cells.
            if (differing.length >= lastDiffering) maxSize = Math.min(9, maxSize + 2);
            lastDiffering = differing.length;

            const next = mergeAlongCells(cages, solution, rand, differing, maxSize);
            if (!next) break;
            cages = next;
            merges++;
            continue;
        }
        // Aborted with <2 solutions: escalate budget; if the escalation still
        // can't decide, do ONE full-board merge that unions the two cages of
        // the largest ambiguous region (maxSize=9 pass) before giving up.
        if (collectCap < probeCap * 4) {
            collectCap *= 2;
            continue;
        }
        const bigPass = solveKillerCollect(cages, 2, confirmCap);
        if (bigPass.solutions.length >= 2) {
            const a = bigPass.solutions[0], b = bigPass.solutions[1];
            const differing = [];
            for (let r = 0; r < N; r++)
                for (let c = 0; c < N; c++)
                    if (a[r][c] !== b[r][c]) differing.push([r, c]);
            const next = mergeAlongCells(cages, solution, rand, differing, 9);
            if (!next) break;
            cages = next;
            merges++;
        } else {
            break; // couldn't find 2 solutions even at full budget — hand off
        }
        collectCap = probeCap;
    }

    // 3) Coarsen while uniqueness is preserved (difficulty = how far we go).
    const coarsenBudget = COARSEN_MERGES[difficulty] ?? COARSEN_MERGES.medium;
    let coarsened = 0;
    while (coarsened < coarsenBudget) {
        const best = pickBestMerge(cages, solution, rand, probeCap, true);
        if (!best) break;
        cages = best.cages;
        coarsened++;
    }

    // 4) Confirmation with targeted reveals. If the collector finds two
    //    solutions, revealing one cell where they differ provably eliminates
    //    one of them — far more effective than blind reveals. If the solver
    //    merely aborts (unknown), reveal any cell to shrink the search space.
    const givens = new Set();
    const givenDigits = {};
    let collectCap2 = probeCap;
    for (let round = 0; round < 24; round++) {
        const { solutions, aborted } = solveKillerCollect(cages, 2, collectCap2, givenDigits);
        if (!aborted && solutions.length === 1) break;      // provably unique

        let revealCell = null;
        if (solutions.length >= 2) {
            collectCap2 = probeCap;
            const a = solutions[0], b = solutions[1];
            for (let r = 0; r < N && !revealCell; r++)
                for (let c = 0; c < N; c++)
                    if (a[r][c] !== b[r][c]) { revealCell = [r, c]; break; }
        }
        if (!revealCell) {
            // Aborted/unknown: escalate budget a bit; if still unknown, blind-reveal.
            if (collectCap2 < probeCap * 2) {
                collectCap2 *= 2;
                round--;                                    // escalation is free
                continue;
            }
            collectCap2 = probeCap;
            const openCells = [];
            for (let r = 0; r < N; r++)
                for (let c = 0; c < N; c++)
                    if (!givens.has(`${r}-${c}`)) openCells.push([r, c]);
            if (openCells.length === 0) break;
            revealCell = openCells[Math.floor(rand() * openCells.length)];
        }
        givens.add(`${revealCell[0]}-${revealCell[1]}`);
        givenDigits[`${revealCell[0]}-${revealCell[1]}`] = solution[revealCell[0]][revealCell[1]];
    }

    return { cages, solution, givens };
}

/**
 * Merge an adjacent, duplicate-free pair where at least one cell of the pair
 * union appears in `cells` (the differing cells of two competing solutions).
 * Deterministic-random pick among candidates; falls back to any valid pair.
 */
function mergeAlongCells(cages, solution, rand, cells, maxSize = 6) {
    const cellSet = new Set(cells.map(([r, c]) => `${r}-${c}`));
    const pairs = listMergePairs(cages, solution, maxSize);
    if (pairs.length === 0) return null;
    const touching = pairs.filter(([ia, ib]) => {
        const union = [...cages[ia].cells, ...cages[ib].cells];
        return union.some(([r, c]) => cellSet.has(`${r}-${c}`));
    });
    const pool = touching.length > 0 ? touching : pairs;
    // Prefer the pair whose union covers the most differing cells (greedy).
    let bestIdx = 0, bestCover = -1;
    for (let i = 0; i < pool.length; i++) {
        const [ia, ib] = pool[i];
        const union = [...cages[ia].cells, ...cages[ib].cells];
        let cover = 0;
        for (const [r, c] of union) if (cellSet.has(`${r}-${c}`)) cover++;
        if (cover > bestCover) { bestCover = cover; bestIdx = i; }
        else if (cover === bestCover && rand() < 0.5) bestIdx = i;
    }
    const [ia, ib] = pool[bestIdx];
    const mergedCells = [...cages[ia].cells, ...cages[ib].cells];
    return finalizeCages(
        cages.filter((_, i) => i !== ia && i !== ib).map((c) => c.cells).concat([mergedCells]),
        solution
    );
}

/** How many uniqueness-preserving merges each difficulty gets after reaching
 *  count=1 (bigger cages = fewer clues = harder). */
export const COARSEN_MERGES = { easy: 0, medium: 5, hard: 10, extreme: 20 };

/**
 * Sample up to 10 adjacent, duplicate-free merge pairs and return the best:
 * - requireUnique=true: only merges whose result is provably count=1 qualify.
 * - requireUnique=false: the merge with the lowest resulting count wins.
 * Ties are broken by seeded randomness so results stay deterministic.
 */
function pickBestMerge(cages, solution, rand, nodeCap, requireUnique) {
    const pairs = listMergePairs(cages, solution);
    if (pairs.length === 0) return null;

    const sampled = [];
    const pool = pairs.slice();
    while (sampled.length < 10 && pool.length > 0) {
        const idx = Math.floor(rand() * pool.length);
        sampled.push(pool.splice(idx, 1)[0]);
    }

    let best = null;
    for (const [ia, ib] of sampled) {
        const mergedCells = [...cages[ia].cells, ...cages[ib].cells];
        const merged = finalizeCages(
            cages.filter((_, i) => i !== ia && i !== ib).map((c) => c.cells).concat([mergedCells]),
            solution
        );
        const c = solveKillerCount(merged, 2, nodeCap);
        if (requireUnique) {
            if (c === 1) return { cages: merged, count: c, ia, ib };
        } else {
            const betterThanBest =
                best === null ||
                (c < best.count) ||
                (c === best.count && rand() < 0.5);
            if (betterThanBest) best = { cages: merged, count: c, ia, ib };
            if (c === 1) break; // cannot do better than unique
        }
    }
    return best;
}

/* ------------------------------ Play-time checks --------------------------- */

/**
 * Would placing `n` at (r, c) violate the cell's cage?
 * (duplicate digit in cage, sum overflow, or completed cage with wrong total)
 */
export function cageViolated(board, cages, cageIdOf, r, c, n) {
    const id = cageIdOf[r][c];
    if (id === -1) return false;
    const cage = cages[id];
    if (!cage) return false;
    let sum = 0;
    let filled = 0;
    for (const [cr, cc] of cage.cells) {
        const v = cr === r && cc === c ? n : board[cr][cc];
        if (v !== 0) {
            if ((cr !== r || cc !== c) && v === n) return true; // duplicate digit in cage
            sum += v;
            filled++;
        }
    }
    if (sum > cage.sum) return true;                                    // overflow already
    if (filled === cage.cells.length && sum !== cage.sum) return true;  // complete but wrong total
    return false;
}

/** Candidate digits for a cell considering row/col/box + cage rules (for notes). */
export function killerCandidates(board, cages, cageIdOf, r, c) {
    const res = [];
    for (let n = 1; n <= 9; n++) {
        if (!isValid(board, r, c, n)) continue;
        if (cageViolated(board, cages, cageIdOf, r, c, n)) continue;
        res.push(n);
    }
    return res;
}
