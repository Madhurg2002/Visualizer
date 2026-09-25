// AI.js — Search & evaluation on the bitboard engine.
//
// Same public API as before (getBestMove / evaluateBoard working on the legacy
// array board), but all search internals run on split 32-bit bitboards with
// make/unmake (zero cloning), alpha-beta, MVV-LVA ordering, quiescence, and a
// transposition table keyed by Zobrist hash.
import {
    WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING,
    rcToSq, sqToRow, sqToCol, setBit, getBit, isEmpty, popCount, popLsb,
    fromBoardArray,
} from './bitboard';
import {
    generatePseudoMoves, generateLegalMoves, make, unmake,
    isInCheck, gameState as engineGameState,
} from './bbEngine';

// ---------- Piece values ----------
const PIECE_VALUES = [100, 320, 330, 500, 900, 20000]; // p n b r q k

// ---------- Positional tables (from White's perspective, row 0 = rank 8) ----------
const MST = {
    p: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5, 5, 10, 25, 25, 10, 5, 5],
        [0, 0, 0, 20, 20, 0, 0, 0],
        [5, -5, -10, 0, 0, -10, -5, 5],
        [5, 10, 10, -20, -20, 10, 10, 5],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    n: [
        [-50, -40, -30, -30, -30, -30, -40, -50],
        [-40, -20, 0, 0, 0, 0, -20, -40],
        [-30, 0, 10, 15, 15, 10, 0, -30],
        [-30, 5, 15, 20, 20, 15, 5, -30],
        [-30, 0, 15, 20, 20, 15, 0, -30],
        [-30, 5, 10, 15, 15, 10, 5, -30],
        [-40, -20, 0, 5, 5, 0, -20, -40],
        [-50, -40, -30, -30, -30, -30, -40, -50]
    ],
    b: [
        [-20, -10, -10, -10, -10, -10, -10, -20],
        [-10, 0, 0, 0, 0, 0, 0, -10],
        [-10, 0, 5, 10, 10, 5, 0, -10],
        [-10, 5, 5, 10, 10, 5, 5, -10],
        [-10, 0, 10, 10, 10, 10, 0, -10],
        [-10, 10, 10, 10, 10, 10, 10, -10],
        [-10, 5, 0, 0, 0, 0, 5, -10],
        [-20, -10, -10, -10, -10, -10, -10, -20]
    ],
    r: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [5, 10, 10, 10, 10, 10, 10, 5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [0, 0, 0, 5, 5, 0, 0, 0]
    ],
    q: [
        [-20, -10, -10, -5, -5, -10, -10, -20],
        [-10, 0, 0, 0, 0, 0, 0, -10],
        [-10, 0, 5, 5, 5, 5, 0, -10],
        [-5, 0, 5, 5, 5, 5, 0, -5],
        [0, 0, 5, 5, 5, 5, 0, -5],
        [-10, 5, 5, 5, 5, 5, 0, -10],
        [-10, 0, 5, 0, 0, 0, 0, -10],
        [-20, -10, -10, -5, -5, -10, -10, -20]
    ],
    k: [
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-20, -30, -30, -40, -40, -30, -30, -20],
        [-10, -20, -20, -20, -20, -20, -20, -10],
        [20, 20, 0, 0, 0, 0, 20, 20],
        [20, 30, 10, 0, 0, 10, 30, 20]
    ]
};

// Flattened square tables for fast lookup: PST[type][color][sq] (0..63,
// row-major with row 0 = rank 8). Black tables are the vertical mirror.
const TYPE_IDS = { p: PAWN, n: KNIGHT, b: BISHOP, r: ROOK, q: QUEEN, k: KING };
const PST = (() => {
    const tables = {};
    for (const t of Object.keys(MST)) {
        const table = [new Int16Array(64), new Int16Array(64)];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = rcToSq(r, c);
                table[WHITE][sq] = MST[t][r][c];
                table[BLACK][sq] = MST[t][7 - r][c];
            }
        }
        tables[TYPE_IDS[t]] = table;
    }
    return tables;
})();

// ---------- Evaluation (absolute, White-positive) ----------
// Accepts a bitboard position, or a legacy 8x8 array board (auto-converted).
export const evaluateBoard = (input) => {
    const pos = Array.isArray(input) ? fromBoardArray(input, 'w', null) : input;
    let score = 0;
    for (let color = 0; color < 2; color++) {
        for (let t = 0; t < 6; t++) {
            const b = { lo: pos.pieces[color * 6 + t].lo, hi: pos.pieces[color * 6 + t].hi };
            const sign = color === WHITE ? 1 : -1;
            const table = PST[t];
            let sq;
            while ((sq = popLsb(b)) >= 0) {
                score += sign * (PIECE_VALUES[t] + table[color][sq]);
            }
        }
    }
    return score;
};

// ---------- Transposition table ----------
const TT = new Map();
const TT_MAX = 1 << 20;
const ttStore = (keyLo, keyHi, depth, score, type) => {
    if (TT.size >= TT_MAX) TT.clear();
    TT.set(keyLo + ':' + keyHi, { depth, score, type });
};

const MATE = 90000;

// ---------- Search ----------
const MATE_PLY = 1000; // Subtract plies to prefer faster mates.

const search = (pos, depth, alpha, beta, ply) => {
    const whiteMax = pos.side === WHITE;

    if (depth === 0) return quiescence(pos, alpha, beta);

    const key = pos.keyLo + ':' + pos.keyHi;
    const cached = TT.get(key);
    let alphaOrig = alpha, betaOrig = beta;
    if (cached && cached.depth >= depth) {
        if (cached.type === 'exact') return cached.score;
        if (cached.type === 'lower' && cached.score > alpha) alpha = cached.score;
        else if (cached.type === 'upper' && cached.score < beta) beta = cached.score;
        if (alpha >= beta) return cached.score;
    }

    const moves = generateLegalMoves(pos);
    if (moves.length === 0) {
        return isInCheck(pos) ? (whiteMax ? -MATE + ply : MATE - ply) : 0; // Mate or stalemate.
    }

    // MVV-LVA capture ordering (en passant scores as a pawn capture).
    for (const m of moves) {
        if (m.captured >= 0) {
            m.order = 10 * PIECE_VALUES[m.captured % 6] - PIECE_VALUES[m.piece % 6];
        } else if (m.promo >= 0) {
            m.order = PIECE_VALUES[m.promo];
        } else {
            m.order = 0;
        }
    }
    moves.sort((a, b) => b.order - a.order);

    if (whiteMax) {
        let best = -Infinity;
        for (const m of moves) {
            make(pos, m);
            const ev = search(pos, depth - 1, alpha, beta, ply + 1);
            unmake(pos);
            if (ev > best) best = ev;
            if (best > alpha) alpha = best;
            if (alpha >= beta) break;
        }
        ttStore(pos.keyLo, pos.keyHi, depth, best,
            best <= alphaOrig ? 'upper' : best >= betaOrig ? 'lower' : 'exact');
        return best;
    } else {
        let best = Infinity;
        for (const m of moves) {
            make(pos, m);
            const ev = search(pos, depth - 1, alpha, beta, ply + 1);
            unmake(pos);
            if (ev < best) best = ev;
            if (best < beta) beta = best;
            if (alpha >= beta) break;
        }
        ttStore(pos.keyLo, pos.keyHi, depth, best,
            best <= alphaOrig ? 'upper' : best >= betaOrig ? 'lower' : 'exact');
        return best;
    }
};

const quiescence = (pos, alpha, beta) => {
    const standPat = evaluateBoard(pos);
    const whiteMax = pos.side === WHITE;
    if (whiteMax) {
        if (standPat >= beta) return standPat;
        if (standPat > alpha) alpha = standPat;
    } else {
        if (standPat <= alpha) return standPat;
        if (standPat < beta) beta = standPat;
    }

    const pseudo = generatePseudoMoves(pos);
    const captures = [];
    for (const m of pseudo) {
        if (m.captured >= 0) captures.push(m);
    }
    captures.sort((a, b) =>
        (10 * PIECE_VALUES[b.captured % 6] - PIECE_VALUES[b.piece % 6])
        - (10 * PIECE_VALUES[a.captured % 6] - PIECE_VALUES[a.piece % 6]));

    if (whiteMax) {
        for (const m of captures) {
            make(pos, m);
            if (isInCheck(pos, pos.side ^ 1)) { // Illegal (king left in check) → skip.
                unmake(pos);
                continue;
            }
            const ev = quiescence(pos, alpha, beta);
            unmake(pos);
            if (ev > alpha) alpha = ev;
            if (alpha >= beta) return alpha;
        }
        return alpha;
    } else {
        for (const m of captures) {
            make(pos, m);
            if (isInCheck(pos, pos.side ^ 1)) {
                unmake(pos);
                continue;
            }
            const ev = quiescence(pos, alpha, beta);
            unmake(pos);
            if (ev < beta) beta = ev;
            if (alpha >= beta) return beta;
        }
        return beta;
    }
};

// ---------- Public API ----------
// Returns { move: { from: {row,col}, to: {row,col}, ... }, score }.
// `isMaximizingPlayer` selects the color to search for (true → white).
export const getBestMove = (board, depth, isMaximizingPlayer, lastMove) => {
    const turn = isMaximizingPlayer ? 'w' : 'b';
    const pos = fromBoardArray(board, turn, lastMove);
    const rootColor = pos.side; // WHITE or BLACK
    const maximizing = rootColor === WHITE;

    const moves = generateLegalMoves(pos);
    if (moves.length === 0) return { move: null, score: isInCheck(pos) ? (maximizing ? -MATE : MATE) : 0 };

    // MVV-LVA root ordering.
    for (const m of moves) {
        m.order = m.captured >= 0 ? 10 * PIECE_VALUES[m.captured % 6] - PIECE_VALUES[m.piece % 6] : 0;
    }
    moves.sort((a, b) => b.order - a.order);

    TT.clear();

    let bestMove = moves[0];
    let bestScore = maximizing ? -Infinity : Infinity;
    let alpha = -Infinity, beta = Infinity;

    for (const m of moves) {
        make(pos, m);
        const ev = search(pos, depth - 1, alpha, beta, 1);
        unmake(pos);

        if (maximizing) {
            if (ev > bestScore) { bestScore = ev; bestMove = m; }
            if (bestScore > alpha) alpha = bestScore;
        } else {
            if (ev < bestScore) { bestScore = ev; bestMove = m; }
            if (bestScore < beta) beta = bestScore;
        }
    }

    const toUi = (m) => ({
        from: { row: sqToRow(m.from), col: sqToCol(m.from) },
        to: { row: sqToRow(m.to), col: sqToCol(m.to) },
        capture: m.captured >= 0,
        isPromotion: m.promo >= 0,
        promotionType: m.promo >= 0 ? 'pnbrqk'[m.promo] : undefined,
    });

    return { move: bestMove ? toUi(bestMove) : null, score: bestScore };
};

export const PIECE_VALUE_TABLE = PIECE_VALUES;
