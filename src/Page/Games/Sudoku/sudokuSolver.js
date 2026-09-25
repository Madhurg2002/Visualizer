// Shared Sudoku solver — fast MRV (minimum remaining values) with bitmask
// constraint tracking. Used by both the classic Sudoku page and the Killer
// Sudoku page. Exports:
//
//   solveSudoku(board, opts)          → { solved, board, steps, nodes, aborted }
//   solveSudokuCount(board, opts)     → number of solutions (up to `limit`)
//   computeCandidates(board, opts)    → bitmask of valid digits for every empty cell
//   candidateDigits(mask)             → [digits] helper
//
// `opts` lets callers add constraint hooks:
//   canPlace(r, c, n)      extra legality check (e.g. cage rules)
//   onPlace(r, c, n)       callback for visualization (returns nothing)
//   onBacktrack(r, c)      callback for visualization
//   nodeCap                safety budget; search aborts beyond it
//
// The engine maintains row/col/box bitmasks and an MRV frontier, so worst-case
// hardness never turns into a pathological 9^81 walk — the Killer seed
// `rjyjs0y1` that used to hang the naive DFS solves in a few thousand nodes.

export const N = 9;

const bitsOf = (n) => 1 << n;
const FULL = 0x3FE; // bits 1..9 set

export function popcount(x) {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    x = (x + (x >>> 4)) & 0x0f0f0f0f;
    return (x * 0x01010101) >>> 24;
}

export function candidateDigits(mask) {
    const out = [];
    for (let d = 1; d <= 9; d++) if (mask & bitsOf(d)) out.push(d);
    return out;
}

/** Bitmask of digits still legal at (r,c) for plain sudoku rules. */
export function computeCandidates(board, opts = {}) {
    const rows = new Array(N).fill(0);
    const cols = new Array(N).fill(0);
    const boxes = new Array(N).fill(0);
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const v = board[r][c];
            if (v) {
                const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
                rows[r] |= bitsOf(v); cols[c] |= bitsOf(v); boxes[b] |= bitsOf(v);
            }
        }
    }
    const masks = [];
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (board[r][c] !== 0) { masks.push(0); continue; }
            const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
            let mask = ~(rows[r] | cols[c] | boxes[b]) & FULL;
            if (opts.canPlace) {
                let m2 = 0;
                for (const d of candidateDigits(mask)) if (opts.canPlace(r, c, d)) m2 |= bitsOf(d);
                mask = m2;
            }
            masks.push(mask);
        }
    }
    return masks;
}

/**
 * Core solver. Returns { solved, board, nodes, aborted, steps }.
 * Non-mutating: input board is copied.
 */
export function solveSudoku(board, opts = {}) {
    const { canPlace = null, nodeCap = 500000 } = opts;
    const grid = board.map((row) => row.slice());
    const rows = new Array(N).fill(0);
    const cols = new Array(N).fill(0);
    const boxes = new Array(N).fill(0);
    const cageUsed = new Map(); // for killer: cageId -> bitmask (managed by canPlace wrapper)

    let nodes = 0;
    let aborted = false;

    const boxId = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

    // Seed masks from the initial board. If the givens already conflict,
    // bail out early instead of looping.
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const v = grid[r][c];
            if (!v) continue;
            const b = boxId(r, c);
            const bit = bitsOf(v);
            if ((rows[r] & bit) || (cols[c] & bit) || (boxes[b] & bit)) {
                return { solved: false, board: grid, nodes: 0, aborted: false, steps: [] };
            }
            if (canPlace && !canPlace(r, c, v, grid)) {
                return { solved: false, board: grid, nodes: 0, aborted: false, steps: [] };
            }
            rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        }
    }

    function dfs() {
        if (aborted) return false;
        if (nodes++ > nodeCap) { aborted = true; return false; }

        // MRV: find the empty cell with fewest candidates.
        let bestR = -1, bestC = -1, bestMask = 0, bestCount = 10;
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (grid[r][c] !== 0) continue;
                const mask = ~(rows[r] | cols[c] | boxes[boxId(r, c)]) & FULL;
                const cnt = popcount(mask);
                if (cnt === 0) return false; // dead end
                if (cnt < bestCount) {
                    bestCount = cnt; bestR = r; bestC = c; bestMask = mask;
                    if (cnt === 1) break;
                }
            }
            if (bestCount === 1) break;
        }
        if (bestR === -1) return true; // solved

        for (const d of candidateDigits(bestMask)) {
            if (canPlace && !canPlace(bestR, bestC, d, grid)) continue;
            const b = boxId(bestR, bestC), bit = bitsOf(d);
            grid[bestR][bestC] = d;
            rows[bestR] |= bit; cols[bestC] |= bit; boxes[b] |= bit;
            if (opts.onPlace) opts.onPlace(bestR, bestC, d);
            if (dfs()) return true;
            grid[bestR][bestC] = 0;
            rows[bestR] &= ~bit; cols[bestC] &= ~bit; boxes[b] &= ~bit;
            if (opts.onBacktrack) opts.onBacktrack(bestR, bestC);
            if (aborted) return false;
        }
        return false;
    }

    const solved = dfs();
    return { solved, board: grid, nodes, aborted, steps: [] };
}

/** Count solutions up to `limit` (default 2 — "is it unique?"). */
export function solveSudokuCount(board, opts = {}) {
    const { canPlace = null, limit = 2, nodeCap = 200000 } = opts;
    const grid = board.map((row) => row.slice());
    const rows = new Array(N).fill(0);
    const cols = new Array(N).fill(0);
    const boxes = new Array(N).fill(0);
    let count = 0;
    let nodes = 0;
    let aborted = false;

    const boxId = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const v = grid[r][c];
            if (!v) continue;
            const b = boxId(r, c), bit = bitsOf(v);
            if ((rows[r] & bit) || (cols[c] & bit) || (boxes[b] & bit)) return aborted ? Infinity : 0;
            if (canPlace && !canPlace(r, c, v, grid)) return aborted ? Infinity : 0;
            rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        }
    }

    function dfs() {
        if (aborted) return;
        if (nodes++ > nodeCap) { aborted = true; return; }
        let bestR = -1, bestC = -1, bestMask = 0, bestCount = 10;
        for (let r = 0; r < N && bestCount > 1; r++) {
            for (let c = 0; c < N && bestCount > 1; c++) {
                if (grid[r][c] !== 0) continue;
                const mask = ~(rows[r] | cols[c] | boxes[boxId(r, c)]) & FULL;
                const cnt = popcount(mask);
                if (cnt === 0) return;
                if (cnt < bestCount) { bestCount = cnt; bestR = r; bestC = c; bestMask = mask; }
            }
        }
        if (bestR === -1) { count++; return; }
        for (const d of candidateDigits(bestMask)) {
            if (canPlace && !canPlace(bestR, bestC, d, grid)) continue;
            const b = boxId(bestR, bestC), bit = bitsOf(d);
            grid[bestR][bestC] = d;
            rows[bestR] |= bit; cols[bestC] |= bit; boxes[b] |= bit;
            dfs();
            grid[bestR][bestC] = 0;
            rows[bestR] &= ~bit; cols[bestC] &= ~bit; boxes[b] &= ~bit;
            if (count >= limit || aborted) return;
        }
    }

    dfs();
    return aborted ? Infinity : count;
}
