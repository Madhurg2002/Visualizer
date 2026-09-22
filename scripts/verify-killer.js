// Temporary verification script for the Killer Sudoku engine.
// Run: node scripts/verify-killer.js
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
    path.join(__dirname, "..", "src", "Page", "Games", "KillerSudoku", "utils.js"),
    "utf8"
);
// Strip ESM `export ` keywords so the file parses as CommonJS, then append an
// explicit export list (the source uses named `export function/const` only).
const EXPORT_NAMES = [
    "size", "N", "KILLER_AVG_CAGE", "randomSeed", "createSeededRNG", "shuffle",
    "isValid", "generateFull", "isComplete", "buildCageIdOf", "growCages",
    "solveKillerCount", "generateKillerPuzzle", "cageViolated", "killerCandidates",
];
const commonjs = src.replace(/^export\s+/gm, "") +
    "\nmodule.exports = {" + EXPORT_NAMES.map((n) => `${n}`).join(", ") + "};";
const mod = { exports: {} };
const factory = new Function("module", "exports", commonjs);
factory(mod, mod.exports);
const K = mod.exports;

function run(seed, difficulty) {
    const t0 = Date.now();
    const a = K.generateKillerPuzzle(seed, difficulty);
    const b = K.generateKillerPuzzle(seed, difficulty);
    const t1 = Date.now();

    const sig = (p) => JSON.stringify({
        cages: p.cages.map((c) => [c.cells.map(([r, c]) => r * 9 + c), c.sum]),
        solution: p.solution.flat(),
        givens: [...p.givens].sort(),
    });
    const deterministic = sig(a) === sig(b);

    // Cage coverage + rule checks
    const N = 9;
    const seen = new Set();
    let coverOk = true;
    let dupOk = true;
    let sumOk = true;
    let noSingles = true;
    for (const cage of a.cages) {
        if (cage.cells.length < 2) noSingles = false;
        const digits = new Set();
        for (const [r, c] of cage.cells) {
            const key = `${r}-${c}`;
            if (seen.has(key)) coverOk = false;
            seen.add(key);
            const d = a.solution[r][c];
            if (digits.has(d)) dupOk = false;
            digits.add(d);
        }
        const s = cage.cells.reduce((acc, [r, c]) => acc + a.solution[r][c], 0);
        if (s !== cage.sum) sumOk = false;
    }
    const coversBoard = seen.size === N * N;

    // Uniqueness (givens included in the count)
    const givenDigits = {};
    for (const key of a.givens) {
        const [r, c] = key.split("-").map(Number);
        givenDigits[key] = a.solution[r][c];
    }
    const count = K.solveKillerCount(a.cages, 2, 200000, givenDigits);

    return {
        seed, difficulty,
        cages: a.cages.length,
        givens: a.givens.size,
        deterministic,
        coverOk, coversBoard, dupOk, sumOk, noSingles,
        unique: count === 1,
        count,
        ms: t1 - t0,
    };
}

const seeds = ["abc12345", "testseed", "zx9k2m1p", "q7f3t8w2", "hellokiller"];
const diffs = ["easy", "medium", "hard", "extreme"];

let failures = 0;
for (const seed of seeds) {
    for (const d of diffs) {
        const r = run(seed, d);
        const ok = r.deterministic && r.coverOk && r.coversBoard && r.dupOk && r.sumOk && r.noSingles && r.unique;
        if (!ok) failures++;
        console.log(
            `${ok ? "PASS" : "FAIL"} seed=${seed} diff=${d} cages=${r.cages} givens=${r.givens} unique=${r.unique} count=${r.count} det=${r.deterministic} cover=${r.coversBoard} dupOk=${r.dupOk} sumOk=${r.sumOk} noSingles=${r.noSingles} ${r.ms}ms`
        );
    }
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
