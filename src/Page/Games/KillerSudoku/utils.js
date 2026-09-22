// Killer Sudoku engine — self-contained (no imports from the classic Sudoku page).
//
// A proper Killer Sudoku has NO given digits: the dashed cages with their sums are
// the only clues. This module:
//   1. generates a full solution grid (seeded, deterministic),
//   2. grows connected cages over it (no repeated digits inside a cage),
//   3. verifies the puzzle is UNIQUE with a real cage-aware solver,
//   4. if not unique, merges adjacent cages (removes freedom) and finally
//      reveals a few solution cells as givens so a unique solution is guaranteed.

export const size = 3;
export const N = 9;

/** Average cage size per difficulty — bigger cages = fewer sum clues = harder. */
export const KILLER_AVG_CAGE = { easy: 2.2, medium: 2.7, hard: 3.3, extreme: 4.0 };

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

export function solveKillerCount(cages, limit = 2, nodeCap = 90000) {
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

    let count = 0;
    let nodes = 0;
    let aborted = false;

    const bitsOf = (n) => 1 << n;

    /** Digits still placeable in `cell` under all constraints (bitmask). */
    function candidates(r, c) {
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const cid = cageIdOf[r][c];
        const cage = cageInfo[cid];
        let mask = 0;
        const blocked = rows[r] | cols[c] | boxes[b] | (cid >= 0 ? cage.used : 0);
        for (let d = 1; d <= 9; d++) {
            if (blocked & bitsOf(d)) continue;
            if (cid >= 0) {
                // Sum bounds: placed + d + (min|max sum of remaining-1 digits) vs target
                const k = cage.remaining - 1;
                const avail = [];
                for (let v = 1; v <= 9; v++) if (!(cage.used & bitsOf(v)) && v !== d) avail.push(v);
                if (avail.length < k) continue;
                avail.sort((a, b2) => a - b2);
                const minRest = avail.slice(0, k).reduce((a, v) => a + v, 0);
                const maxRest = avail.slice(-k).reduce((a, v) => a + v, 0);
                const s = cage.placed + d;
                if (s + minRest > cage.target || s + maxRest < cage.target) continue;
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

function popcount(x) {
    let n = 0;
    while (x) { x &= x - 1; n++; }
    return n;
}

/** Merge one seeded-random adjacent cage pair whose union stays duplicate-free. */
function tryMergeCages(cages, solution, rand) {
    const cageIdOf = buildCageIdOf(cages);
    const pairs = [];
    for (let idA = 0; idA < cages.length; idA++) {
        for (let idB = idA + 1; idB < cages.length; idB++) {
            const a = cages[idA], b = cages[idB];
            if (a.cells.length + b.cells.length > 7) continue;
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
    if (pairs.length === 0) return null;
    const [ia, ib] = pairs[Math.floor(rand() * pairs.length)];
    const merged = cages
        .filter((_, i) => i !== ia && i !== ib)
        .concat([{ cells: [...cages[ia].cells, ...cages[ib].cells] }]);
    return finalizeCages(merged.map((c) => c.cells), solution);
}

/* --------------------------- Puzzle orchestration -------------------------- */

/**
 * Generate a unique killer puzzle deterministically from a seed.
 * Returns { cages, solution, givens } — givens is a Set of "r-c" keys (usually empty;
 * a handful of reveals is used only when cage merging cannot ensure uniqueness).
 */
export function generateKillerPuzzle(seed, difficulty) {
    const rand = createSeededRNG(seed + "-killer-gen");
    const solution = generateFull(seed);
    const avg = KILLER_AVG_CAGE[difficulty] || KILLER_AVG_CAGE.medium;

    let cages = growCages(seed, avg, solution);
    let count = solveKillerCount(cages, 2);

    // 1) Reduce freedom by merging adjacent cages while the solution is not unique.
    let merges = 0;
    while (count !== 1 && count !== Infinity && merges < 24) {
        const next = tryMergeCages(cages, solution, rand);
        if (!next) break;
        cages = next;
        count = solveKillerCount(cages, 2);
        merges++;
    }

    // 2) Last resort: reveal solution cells until the puzzle is provably unique.
    const givens = new Set();
    let guard = 0;
    while (count !== 1 && guard < 16) {
        const candidates = [];
        for (let r = 0; r < N; r++)
            for (let c = 0; c < N; c++)
                if (!givens.has(`${r}-${c}`)) candidates.push([r, c]);
        if (candidates.length === 0) break;
        const [r, c] = candidates[Math.floor(rand() * candidates.length)];
        givens.add(`${r}-${c}`);
        guard++;
        count = solveKillerCount(cages, 2);
    }

    return { cages, solution, givens };
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
