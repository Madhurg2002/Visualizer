// Regression harness for the Chess bitboard migration.
// Run: node scripts/verify-chess.js
//
// The chess modules are browser ESM (CRA): bundler-style relative imports and
// top-level `export` declarations. To run them in Node we rewrite imports to
// absolute .mjs paths, strip the export keywords (collecting the names), and
// re-export everything as a single default object.
const fs = require("fs");
const path = require("path");
const os = require("os");

const CHESS_DIR = path.join(__dirname, "..", "src", "Page", "Games", "Chess");
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "chess-verify-"));

function loadModule(file) {
    let src = fs.readFileSync(path.join(CHESS_DIR, file), "utf8");
    let counter = 0;
    src = src.replace(
        /^import\s+(?:([A-Za-z_$][\w$]*)\s*,\s*)?(?:\{([^}]*)\})?\s*from\s*['"]([^'"]+)['"]\s*;?\s*$/gm,
        (m, def, named, spec) => {
            const abs = spec.startsWith(".")
                ? path.join(WORK_DIR, path.basename(spec).replace(/\.js$/, "") + ".mjs")
                : spec;
            const id = `__m${counter++}`;
            let out = `import ${id} from ${JSON.stringify(abs)};`;
            if (def) out += ` const ${def} = ${id}.default || ${id};`;
            if (named) out += ` const {${named.replace(/\s+as\s+/g, ": ")}} = ${id};`;
            return out;
        }
    );
    const names = [];
    src = src.replace(
        /^export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm,
        (m, name) => { names.push(name); return m.slice("export ".length); }
    );
    src = src.replace(/^export\s*\{([^}]*)\}\s*;?\s*$/gm, (m, inner) => {
        inner.split(",").forEach(part => {
            const name = part.trim().split(/\s+as\s+/).pop();
            if (name) names.push(name);
        });
        return "";
    });
    src += `\nexport default { ${names.join(", ")} };`;
    const tmp = path.join(WORK_DIR, file.replace(/\.js$/, "") + ".mjs");
    fs.writeFileSync(tmp, src);
    return import(tmp);
}

function bench(label, fn) {
    const t0 = process.hrtime.bigint();
    const result = fn();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    return { result, ms, label };
}

let failures = 0;
function check(name, ok, extra) {
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
}

(async () => {
    const BB = (await loadModule("bitboard.js")).default;
    const Engine = (await loadModule("bbEngine.js")).default;

    // ---------- PERFT (move generator correctness) ----------
    const perftSuite = [
        { fen: BB.START_FEN, expected: [20, 400, 8902, 197281] },
        { fen: "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -", expected: [14, 191, 2812, 43238] },
        { fen: "n1n5/PPPk4/8/8/8/8/4Kppp/5N1N b - - 0 1", expected: [24, 496, 9483, 182838] },
        // Kiwipete: castling, pins, EP, promotions.
        { fen: "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", expected: [48, 2039, 97862] },
        // CPW position 4: promotions + castling interplay.
        { fen: "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", expected: [6, 264, 9467] },
        // CPW position 5: tricky checks + EP.
        { fen: "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", expected: [44, 1486, 62379] },
    ];

    for (const { fen, expected } of perftSuite) {
        for (let d = 1; d <= expected.length; d++) {
            const { result: nodes, ms } = bench(`perft${d}`, () => Engine.perft(fen, d));
            const ok = nodes === expected[d - 1];
            check(`perft(${d}) ${fen.slice(0, 20)}…`, ok, `nodes=${nodes} want=${expected[d - 1]} (${ms.toFixed(0)}ms)`);
        }
    }

    // Speed sanity: depth-3 full legal movegen from start should be well under 1s.
    const { result: n3, ms: ms3 } = bench("perft3", () => Engine.perft(BB.START_FEN, 3));
    console.log(`INFO perft(3) speed: ${Math.round(n3 / (ms3 / 1000))} nodes/sec`);

    // ---------- EN-PASSANT PIN REGRESSION ----------
    // k a4, R h4, P d4, p e4, EP target d3: EP capture would vacate rank 4 and
    // expose the king → must be illegal. Hand-computed perft(1) = 5.
    const epPin = Engine.fromFen("8/8/8/8/k2Pp2R/8/8/4K3 b - d3 0 1");
    const epPinMoves = Engine.generateLegalMoves(epPin).map(Engine.uciOf);
    check("EP pinned on rank is illegal", !epPinMoves.includes("e4d3") && epPinMoves.length === 6,
        epPinMoves.join(","));
    // EP along a pinned diagonal IS legal (c4xd3, king b6, own bishop c5 blocks).
    const epDiag = Engine.fromFen("8/8/1k6/2b5/2pP4/8/5K2/8 b - d3 0 1");
    const epDiagMoves = Engine.generateLegalMoves(epDiag).map(Engine.uciOf);
    check("EP legal when no pin results", epDiagMoves.includes("c4d3") && epDiagMoves.length === 15,
        `moves=${epDiagMoves.length}`);

    // ---------- GAME STATE CHECKS ----------
    // Fool's mate: 1.f3 e5 2.g4 Qh4#
    let pos = Engine.fromFen(BB.START_FEN);
    const foolsMate = ["f2f3", "e7e5", "g2g4", "d8h4"];
    for (const uci of foolsMate) {
        const moves = Engine.generateLegalMoves(pos);
        const mv = moves.find(m => Engine.uciOf(m) === uci);
        if (!mv) { check("fool's mate " + uci, false, "move not found"); pos = null; break; }
        Engine.make(pos, mv);
    }
    if (pos) {
        const state = Engine.gameState(pos);
        check("fool's mate is checkmate", state === "checkmate", `state=${state}`);
    }

    // 7k/5Q2/6K1/8/8/8/8/8 b - - : black king h8, white Q f7 + K g6 → stalemate.
    const stale = Engine.fromFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    check("constructed stalemate detected", Engine.gameState(stale) === "stalemate",
        `state=${Engine.gameState(stale)} moves=${Engine.generateLegalMoves(stale).length}`);

    // Insufficient material: K vs K
    const kvk = Engine.fromFen("8/8/4k3/8/8/3K4/8/8 w - - 0 1");
    check("K vs K is draw", Engine.gameState(kvk) === "draw");

    // Castling legality with rooks on home squares.
    const castlePos = Engine.fromFen("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    const castleMoves = Engine.generateLegalMoves(castlePos).map(Engine.uciOf);
    check("castling both sides legal", castleMoves.includes("e1g1") && castleMoves.includes("e1c1"),
        castleMoves.filter(u => u.startsWith("e1")).join(","));

    // ---------- LOGIC API COMPATIBILITY (array-based facade) ----------
    try {
        const logic = (await loadModule("logic.js")).default;
        const board = logic.initialBoard; // exported array value (UI contract)
        check("initialBoard is 8x8", Array.isArray(board) && board.length === 8 && board[0].length === 8);
        const e2 = logic.getValidMoves(board, 6, 4, null); // e2 pawn
        check("e2 pawn has 2 legal moves", e2.length === 2, JSON.stringify(e2));
        const g1 = logic.getValidMoves(board, 7, 6, null); // g1 knight
        check("g1 knight has 2 legal moves", g1.length === 2, JSON.stringify(g1));
        check("boardToFen start", logic.boardToFen(board, "w") === BB.START_FEN,
            logic.boardToFen(board, "w"));

        // Fool's mate through the facade executeMove
        let b = logic.initialBoard, t = "w", last = null, state = "playing";
        // 1.f3 e5 2.g4 Qd8-h4# → [fromRow, fromCol, toRow, toCol]
        for (const [fr, fc, tr, tc] of [[6, 5, 5, 5], [1, 4, 3, 4], [6, 6, 4, 6], [0, 3, 4, 7]]) {
            const mv = logic.getValidMoves(b, fr, fc, last).find(m => m.row === tr && m.col === tc);
            if (!mv) { check("facade fool's mate move", false, `${fr},${fc}->${tr},${tc}`); break; }
            const res = logic.executeMove(b, t, fr, fc, tr, tc, mv);
            b = res.board; t = res.turn; last = res.lastMove; state = res.state;
        }
        check("facade fool's mate → checkmate", state === "checkmate", `state=${state}`);

        // SAN parsing through pgnUtils (fresh module instance).
        const pgn = (await loadModule("pgnUtils.js")).default;
        const b2 = logic.initialBoard;
        const nf3 = pgn.algebraicToMove("Nf3", b2, "w", null);
        check("SAN Nf3 resolves", !!nf3 && nf3.from.row === 7 && nf3.from.col === 6, JSON.stringify(nf3));
    } catch (e) {
        check("logic.js facade", false, e.message);
    }

    // ---------- AI SPEED ----------
    try {
        const AI = (await loadModule("AI.js")).default;
        const logic = (await loadModule("logic.js")).default;
        const board = logic.initialBoard;
        const { result, ms } = bench("ai-d3", () => AI.getBestMove(board, 3, true, null));
        check("AI depth 3 returns a move", !!result && !!result.move, `score=${result && result.score} (${ms.toFixed(0)}ms)`);
        console.log(`INFO AI depth 3: ${ms.toFixed(0)}ms, best=${result.move ? result.move.from.row + "," + result.move.from.col + "->" + result.move.to.row + "," + result.move.to.col : "none"} score=${result.score}`);
    } catch (e) {
        check("AI.js", false, e.message);
    }

    console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
    process.exit(failures === 0 ? 0 : 1);
})();
