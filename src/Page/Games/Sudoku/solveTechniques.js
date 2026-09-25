// Human-style Sudoku solving techniques (constraint propagation).
//
// Unlike the MRV backtracking engine (sudokuSolver.js), these techniques mimic
// how a person solves: maintain candidate options for every empty cell, place
// digits that are *forced*, and recompute the options after each placement.
//
// Techniques implemented:
//   - Naked single: a cell whose candidate list has exactly one digit.
//   - Hidden single: a digit that fits in exactly one cell of a row/col/box,
//     even if that cell has several candidates.
//
// The solver is generic: callers supply a `getCands(board, r, c)` callback so
// the same code drives classic Sudoku (row/col/box) and Killer Sudoku (plus
// cage sum/duplicate rules).

export const UNITS = (() => {
    const units = [];
    for (let r = 0; r < 9; r++) units.push({ type: "row", idx: r, cells: Array.from({ length: 9 }, (_, c) => [r, c]) });
    for (let c = 0; c < 9; c++) units.push({ type: "col", idx: c, cells: Array.from({ length: 9 }, (_, r) => [r, c]) });
    for (let br = 0; br < 9; br += 3) {
        for (let bc = 0; bc < 9; bc += 3) {
            const cells = [];
            for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) cells.push([r, c]);
            units.push({ type: "box", idx: (br / 3) * 3 + bc / 3, cells });
        }
    }
    return units;
})();

const unitName = (u) =>
    u.type === "row" ? `row ${u.idx + 1}` : u.type === "col" ? `column ${u.idx + 1}` : `box ${u.idx + 1}`;

/**
 * Solve using logic techniques only (no guessing).
 *
 * getCands(board, r, c) → array of digits still possible at (r,c).
 *
 * Returns { solved, stuck, board, moves } where each move is
 * { r, c, n, technique, detail } and detail explains WHY the digit is forced
 * (e.g. "only candidate in this cell", "only spot for 5 in row 3").
 * stuck=true means no more forced moves exist (needs harder techniques).
 */
export function solveWithLogic(board, getCands, opts = {}) {
    const { maxSteps = 81 } = opts;
    const grid = board.map((row) => row.slice());
    const moves = [];
    let stuck = false;

    const boardFull = () => grid.every((row) => row.every((v) => v !== 0));

    while (!boardFull() && moves.length < maxSteps) {
        let placed = null;

        // 1) Naked single: cell with exactly one remaining candidate.
        outer:
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] !== 0) continue;
                const cands = getCands(grid, r, c);
                if (cands.length === 0) { stuck = true; break outer; } // contradiction
                if (cands.length === 1) {
                    placed = {
                        r, c, n: cands[0], technique: "naked single",
                        detail: `${cands[0]} is the only candidate left for this cell`,
                    };
                    break outer;
                }
            }
        }

        // 2) Hidden single: a digit with exactly one home in a unit.
        if (!placed && !stuck) {
            outer2:
            for (const unit of UNITS) {
                // Digits missing from this unit.
                const present = new Set(unit.cells.map(([r, c]) => grid[r][c]));
                for (let n = 1; n <= 9; n++) {
                    if (present.has(n)) continue;
                    const spots = [];
                    for (const [r, c] of unit.cells) {
                        if (grid[r][c] !== 0) continue;
                        if (getCands(grid, r, c).includes(n)) spots.push([r, c]);
                        if (spots.length > 1) break;
                    }
                    if (spots.length === 1) {
                        const [r, c] = spots[0];
                        placed = {
                            r, c, n, technique: "hidden single",
                            detail: `${n} fits nowhere else in ${unitName(unit)}`,
                        };
                        break outer2;
                    }
                }
            }
        }

        if (!placed) { stuck = true; break; }
        grid[placed.r][placed.c] = placed.n;
        moves.push(placed);
    }

    return { solved: boardFull(), stuck, board: grid, moves };
}

/**
 * Hybrid: logic techniques first; when they stall, fall back to the caller's
 * `fallback(board)` (e.g. MRV backtracking) for the remaining cells. The
 * returned moves list only contains logic placements — the fallback result is
 * provided separately so the UI can animate "logic solved this much, the
 * engine took over from here".
 */
export function solveHybrid(board, getCands, fallback) {
    const logic = solveWithLogic(board, getCands);
    if (logic.solved || !logic.stuck) return { ...logic, fallbackUsed: false };
    if (!fallback) return { ...logic, fallbackUsed: false };

    const rest = fallback(logic.board);
    if (!rest.solved) return { ...logic, solved: false, fallbackUsed: true, fallbackResult: rest };
    return {
        solved: true,
        stuck: false,
        board: rest.board,
        moves: logic.moves,
        fallbackUsed: true,
        fallbackMoves: rest.moves || [],
    };
}
