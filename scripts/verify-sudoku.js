// Sanity tests for the shared sudoku solver + killer cage logic.
// Run: node scripts/verify-sudoku.js
//
// Loads the browser ESM modules by stripping imports/exports (same trick as
// verify-chess.js), then checks:
//   1. The Killer seed rjyjs0y1 (which used to hang the naive per-cell DFS)
//      solves instantly through the shared MRV solver with cage constraints.
//   2. A batch of killer puzzles across seeds/difficulties all solve and match
//      the generator's own solution.
//   3. Classic sudoku puzzles (unique-solution givens) solve correctly.
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.join(__dirname, "..");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "sudoku-verify-"));

function loadModule(relFile, extraSource = "") {
    let src = fs.readFileSync(path.join(ROOT, relFile), "utf8");
    src = src.replace(/^import[^;]+;\s*$/gm, "");
    const names = [];
    src = src.replace(/^export\s+(?:async\s+)?(?:const|let|var|function\*?)\s+([A-Za-z_$][\w$]*)/gm,
        (m, name) => { names.push(name); return m.slice("export ".length); });
    src += extraSource;
    src += `\nmodule.exports = { ${names.join(", ")} };`;
    // Unique temp name per source path (Sudoku/utils vs KillerSudoku/utils).
    const tmp = path.join(WORK, relFile.replace(/[\\/]/g, "_").replace(/\.js$/, "") + ".cjs");
    fs.writeFileSync(tmp, src);
    return require(tmp);
}

let failures = 0;
function check(name, ok, extra) {
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
}

// ---------- load modules ----------
const killerUtils = loadModule("src/Page/Games/KillerSudoku/utils.js");
const solverMod = loadModule("src/Page/Games/Sudoku/sudokuSolver.js");
const sudokuUtils = loadModule("src/Page/Games/Sudoku/utils.js");
const { solveSudoku, solveSudokuCount } = solverMod;

// Wrap the ESM solver body into a CommonJS-compatible function object by
// evaluating the stripped source in this module context.
const solver = (() => {
    // solveSudoku/solveSudokuCount were exported through module.exports above.
    return solverMod;
})();

(async () => {
    // ---------- 1. The reported problem seed ----------
    try {
        const seed = "rjyjs0y1";
        const { cages, solution, givens } = await killerUtils.generateKillerPuzzleAsync(seed, "easy", {});
        const empty = Array.from({ length: 9 }, () => Array(9).fill(0));
        // Revealed givens are part of the puzzle — they pin the unique solution.
        const seeded = empty.map((row) => row.slice());
        for (const key of givens) {
            const [r, c] = key.split("-").map(Number);
            seeded[r][c] = solution[r][c];
        }

        const t0 = Date.now();
        const result = killerUtils.solveKillerBoard(cages, seeded, 2000000);
        const ms = Date.now() - t0;

        check("rjyjs0y1: solver finds a solution", result.solved && !result.aborted,
            `nodes=${result.nodes} (${ms}ms)`);
        check("rjyjs0y1: solution matches generator solution",
            result.solved && killerUtils.isComplete(result.board, solution));

        // Row/col/box uniqueness double-check (all 27 units hold 9 distinct digits).
        const unitsOk = (() => {
            for (let i = 0; i < 9; i++) {
                const row = new Set(result.board[i]);
                const col = new Set(result.board.map((rw) => rw[i]));
                if (row.size !== 9 || col.size !== 9) return false;
            }
            for (let br = 0; br < 9; br += 3) for (let bc = 0; bc < 9; bc += 3) {
                const box = new Set();
                for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) box.add(result.board[r][c]);
                if (box.size !== 9) return false;
            }
            return true;
        })();
        check("rjyjs0y1: solution is a valid sudoku grid", result.solved && unitsOk);
    } catch (e) {
        check("rjyjs0y1 pipeline", false, e.message);
    }

    // ---------- 2. Batch: killer seeds across difficulties ----------
    const seeds = ["alpha1", "bravo2", "charlie3", "delta4", "echo5"];
    const diffs = ["easy", "medium", "hard", "extreme"];
    let batchOk = 0, batchTotal = 0, worstMs = 0;
    for (const diff of diffs) {
        for (const seed of seeds) {
            batchTotal++;
            try {
                const { cages, solution, givens } = await killerUtils.generateKillerPuzzleAsync(seed, diff, {});
                const board = Array.from({ length: 9 }, () => Array(9).fill(0));
                for (const key of givens) {
                    const [r, c] = key.split("-").map(Number);
                    board[r][c] = solution[r][c];
                }
                const t0 = Date.now();
                const result = killerUtils.solveKillerBoard(cages, board, 2000000);
                const ms = Date.now() - t0;
                worstMs = Math.max(worstMs, ms);
                if (result.solved && !result.aborted && killerUtils.isComplete(result.board, solution)) batchOk++;
                else check(`killer ${seed}/${diff}`, false, `solved=${result.solved} aborted=${result.aborted}`);
            } catch (e) {
                check(`killer ${seed}/${diff}`, false, e.message);
            }
        }
    }
    check(`killer batch: ${batchOk}/${batchTotal} puzzles solve to the unique solution`,
        batchOk === batchTotal, `worst solve time ${worstMs}ms`);

    // ---------- 3. Classic sudoku ----------
    // Known hard puzzle (Arto Inkala 2012) — pathological for naive DFS.
    const hard = "800000000003600000070090200050007000000045700000100030001000068008500010090000400".split("");
    const hardBoard = Array.from({ length: 9 }, (_, r) =>
        hard.slice(r * 9, r * 9 + 9).map(Number));
    let t0 = Date.now();
    const hardRes = solveSudoku(hardBoard, { nodeCap: 5000000 });
    const hardMs = Date.now() - t0;
    const expected = [
        [8, 1, 2, 7, 5, 3, 6, 4, 9],
        [9, 4, 3, 6, 8, 2, 1, 7, 5],
        [6, 7, 5, 4, 9, 1, 2, 8, 3],
        [1, 5, 4, 2, 3, 7, 8, 9, 6],
        [3, 6, 9, 8, 4, 5, 7, 2, 1],
        [2, 8, 7, 1, 6, 9, 5, 3, 4],
        [5, 2, 1, 9, 7, 4, 3, 6, 8],
        [4, 3, 8, 5, 2, 6, 9, 1, 7],
        [7, 9, 6, 3, 1, 8, 4, 5, 2],
    ];
    check("Inkala 2012 hard puzzle solves", hardRes.solved && !hardRes.aborted &&
        JSON.stringify(hardRes.board) === JSON.stringify(expected), `${hardRes.nodes} nodes, ${hardMs}ms`);

    // Uniqueness counting: empty board (multi), Inkala (unique), invalid board.
    const empty = Array.from({ length: 9 }, () => Array(9).fill(0));
    check("empty board has >1 solution", solveSudokuCount(empty, { limit: 2 }) === 2);
    check("Inkala puzzle is unique", solveSudokuCount(hardBoard, { limit: 2 }) === 1);
    const bad = hardBoard.map(r => r.slice());
    bad[0][1] = 8; // duplicate in row 0
    check("invalid board detected (0 solutions)", solveSudokuCount(bad, { limit: 2 }) === 0);

    // Generated classic puzzle solves to its solution.
    const full = sudokuUtils.generateFull("testsudoku1");
    const puzzle = sudokuUtils.puzzleFromFull(full, 30, "testsudoku1");
    const gen = solveSudoku(puzzle, { nodeCap: 5000000 });
    check("generated classic puzzle solves to solution",
        gen.solved && JSON.stringify(gen.board) === JSON.stringify(full));

    // Partial killer board: user digits are preserved, not overwritten.
    try {
        const { cages, solution } = await killerUtils.generateKillerPuzzleAsync("rjyjs0y1", "easy", {});
        const partial = Array.from({ length: 9 }, () => Array(9).fill(0));
        partial[0][0] = solution[0][0];
        partial[4][4] = solution[4][4];
        partial[8][8] = solution[8][8];
        const pres = killerUtils.solveKillerBoard(cages, partial, 2000000);
        check("killer solver preserves user digits",
            pres.solved && pres.board[0][0] === solution[0][0] &&
            pres.board[4][4] === solution[4][4] && pres.board[8][8] === solution[8][8] &&
            killerUtils.isComplete(pres.board, solution));

        // Duplicate digit in a row is rejected outright.
        const wrong = Array.from({ length: 9 }, () => Array(9).fill(0));
        wrong[0][0] = 5;
        wrong[0][8] = 5;
        const bad = killerUtils.solveKillerBoard(cages, wrong, 2000000);
        check("killer solver rejects contradictory digits", !bad.solved && !bad.aborted,
            `solved=${bad.solved}`);
    } catch (e) {
        check("killer partial/invalid boards", false, e.message);
    }

    console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
    process.exit(failures === 0 ? 0 : 1);
})();
