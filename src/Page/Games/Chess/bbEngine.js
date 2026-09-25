// bbEngine.js — Move generation and game state on bitboards.
//
// Every function takes the plain-object position from bitboard.js (12 split
// 32-bit bitboards + state) and mutates in place with push/pop undo, so search
// never clones the board.
import {
    WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING,
    rcToSq, sqToRow, sqToCol, sqToAlgebraic, algebraicToSq,
    setBit, clearBit, getBit, orBB, andBB, andNot, isEmpty, popCount, popLsb,
    KNIGHT_ATT, KING_ATT, PAWN_ATT_W, PAWN_ATT_B,
    rookAttacks, bishopAttacks, CASTLE_MASK,
    fromFen as bbFromFen,
} from './bitboard';

// Move flags
const FLAG_DOUBLE = 1;
const FLAG_EP = 2;
const FLAG_CASTLE_K = 4;
const FLAG_CASTLE_Q = 8;

// ---------- Zobrist keys (split 32-bit pairs) ----------
function xorshift32(seed) {
    return () => {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        return seed >>> 0;
    };
}
const rng = xorshift32(0x9E3779B9);
const Z_PIECE = Array.from({ length: 12 }, () =>
    Array.from({ length: 64 }, () => ({ lo: rng(), hi: rng() }))
);
const Z_SIDE = { lo: rng(), hi: rng() };
const Z_CASTLE = Array.from({ length: 16 }, () => ({ lo: rng(), hi: rng() }));
const Z_EP = Array.from({ length: 8 }, () => ({ lo: rng(), hi: rng() }));

const xorKey = (pos, o) => { pos.keyLo ^= o.lo; pos.keyHi ^= o.hi; };

// Compute the full key once after constructing a position (make/unmake keep it
// up to date incrementally afterwards).
export const initKey = (pos) => {
    pos.keyLo = 0; pos.keyHi = 0;
    for (let i = 0; i < 12; i++) {
        const b = { lo: pos.pieces[i].lo, hi: pos.pieces[i].hi };
        let sq;
        while ((sq = popLsb(b)) >= 0) xorKey(pos, Z_PIECE[i][sq]);
    }
    xorKey(pos, Z_CASTLE[pos.castling]);
    if (pos.ep >= 0) xorKey(pos, Z_EP[pos.ep & 7]);
    if (pos.side === BLACK) xorKey(pos, Z_SIDE);
    return pos;
};

export const fromFen = (fen) => initKey(bbFromFen(fen));

// ---------- occupancy helpers ----------
export const occupied = (pos) => {
    let lo = 0, hi = 0;
    for (let i = 0; i < 12; i++) { lo |= pos.pieces[i].lo; hi |= pos.pieces[i].hi; }
    return { lo, hi };
};
export const sidePieces = (pos, color) => {
    let lo = 0, hi = 0;
    for (let t = 0; t < 6; t++) { lo |= pos.pieces[color * 6 + t].lo; hi |= pos.pieces[color * 6 + t].hi; }
    return { lo, hi };
};
// Piece index at a square (color * 6 + type), or -1.
export const pieceAt = (pos, sq) => {
    for (let i = 0; i < 12; i++) if (getBit(pos.pieces[i], sq)) return i;
    return -1;
};

// ---------- attack detection ----------
export const isSquareAttacked = (pos, sq, byColor) => {
    const base = byColor * 6;
    // Pawns: a white pawn attacks sq iff it stands on PAWN_ATT_B[sq] (and vice versa).
    const pawnAtt = byColor === WHITE ? PAWN_ATT_B[sq] : PAWN_ATT_W[sq];
    if (!isEmpty(andBB(pawnAtt, pos.pieces[base + PAWN]))) return true;
    if (!isEmpty(andBB(KNIGHT_ATT[sq], pos.pieces[base + KNIGHT]))) return true;
    if (!isEmpty(andBB(KING_ATT[sq], pos.pieces[base + KING]))) return true;
    const occ = occupied(pos);
    const slidersR = orBB(pos.pieces[base + ROOK], pos.pieces[base + QUEEN]);
    const slidersB = orBB(pos.pieces[base + BISHOP], pos.pieces[base + QUEEN]);
    if (!isEmpty(andBB(rookAttacks(sq, occ), slidersR))) return true;
    if (!isEmpty(andBB(bishopAttacks(sq, occ), slidersB))) return true;
    return false;
};

export const isInCheck = (pos, color = pos.side) =>
    isSquareAttacked(pos, pos.kings[color], color ^ 1);

// ---------- move generation ----------
// Engine move shape: { from, to, piece, captured (-1), promo (-1|type), flags }
const mkMove = (from, to, piece, captured, promo = -1, flags = 0) =>
    ({ from, to, piece, captured, promo, flags });

// Push helpers share this to emit promotion variants.
const pushPawnMove = (out, from, to, piece, captured, flags) => {
    const us = piece < 6 ? WHITE : BLACK; // piece index = color*6+type, WHITE=0
    const promoRow = us === WHITE ? 0 : 7;
    if (sqToRow(to) === promoRow) {
        out.push(mkMove(from, to, piece, captured, QUEEN, flags));
        out.push(mkMove(from, to, piece, captured, ROOK, flags));
        out.push(mkMove(from, to, piece, captured, BISHOP, flags));
        out.push(mkMove(from, to, piece, captured, KNIGHT, flags));
    } else {
        out.push(mkMove(from, to, piece, captured, -1, flags));
    }
};

export const generatePseudoMoves = (pos) => {
    const out = [];
    const us = pos.side, them = us ^ 1;
    const base = us * 6;
    const themPieces = sidePieces(pos, them);
    const occ = occupied(pos);

    for (let t = 0; t < 6; t++) {
        const pieceIdx = base + t;
        const b = { lo: pos.pieces[pieceIdx].lo, hi: pos.pieces[pieceIdx].hi };
        let sq;
        while ((sq = popLsb(b)) >= 0) {
            if (t === PAWN) {
                const fwd = us === WHITE ? sq - 8 : sq + 8;
                const startRow = us === WHITE ? 6 : 1;
                if (fwd >= 0 && fwd < 64 && !getBit(occ, fwd)) {
                    pushPawnMove(out, sq, fwd, pieceIdx, -1, 0);
                    const fwd2 = us === WHITE ? sq - 16 : sq + 16;
                    if (sqToRow(sq) === startRow && !getBit(occ, fwd2)) {
                        out.push(mkMove(sq, fwd2, pieceIdx, -1, -1, FLAG_DOUBLE));
                    }
                }
                const att = us === WHITE ? PAWN_ATT_W[sq] : PAWN_ATT_B[sq];
                const capTargets = { lo: att.lo & themPieces.lo, hi: att.hi & themPieces.hi };
                let target;
                while ((target = popLsb(capTargets)) >= 0) {
                    pushPawnMove(out, sq, target, pieceIdx, pieceAt(pos, target), 0);
                }
                // En passant
                if (pos.ep >= 0 && getBit(att, pos.ep)) {
                    out.push(mkMove(sq, pos.ep, pieceIdx, them * 6 + PAWN, -1, FLAG_EP));
                }
            } else if (t === KNIGHT || t === KING) {
                const att = t === KNIGHT ? KNIGHT_ATT[sq] : KING_ATT[sq];
                const targets = andNot(att, sidePieces(pos, us));
                let target;
                while ((target = popLsb(targets)) >= 0) {
                    out.push(mkMove(sq, target, pieceIdx, pieceAt(pos, target)));
                }
            } else {
                const att = t === ROOK ? rookAttacks(sq, occ)
                    : t === BISHOP ? bishopAttacks(sq, occ)
                        : orBB(rookAttacks(sq, occ), bishopAttacks(sq, occ));
                const targets = andNot(att, sidePieces(pos, us));
                let target;
                while ((target = popLsb(targets)) >= 0) {
                    out.push(mkMove(sq, target, pieceIdx, pieceAt(pos, target)));
                }
            }
        }
    }

    // Castling (rights imply king+rook unmoved; verify presence for foreign positions)
    if (us === WHITE) {
        if ((pos.castling & 1) && getBit(pos.pieces[base + ROOK], 63)
            && !getBit(occ, 61) && !getBit(occ, 62)
            && !isSquareAttacked(pos, 60, BLACK) && !isSquareAttacked(pos, 61, BLACK)) {
            out.push(mkMove(60, 62, base + KING, -1, -1, FLAG_CASTLE_K));
        }
        if ((pos.castling & 2) && getBit(pos.pieces[base + ROOK], 56)
            && !getBit(occ, 57) && !getBit(occ, 58) && !getBit(occ, 59)
            && !isSquareAttacked(pos, 60, BLACK) && !isSquareAttacked(pos, 59, BLACK)) {
            out.push(mkMove(60, 58, base + KING, -1, -1, FLAG_CASTLE_Q));
        }
    } else {
        if ((pos.castling & 4) && getBit(pos.pieces[base + ROOK], 7)
            && !getBit(occ, 5) && !getBit(occ, 6)
            && !isSquareAttacked(pos, 4, WHITE) && !isSquareAttacked(pos, 5, WHITE)) {
            out.push(mkMove(4, 6, base + KING, -1, -1, FLAG_CASTLE_K));
        }
        if ((pos.castling & 8) && getBit(pos.pieces[base + ROOK], 0)
            && !getBit(occ, 1) && !getBit(occ, 2) && !getBit(occ, 3)
            && !isSquareAttacked(pos, 4, WHITE) && !isSquareAttacked(pos, 3, WHITE)) {
            out.push(mkMove(4, 2, base + KING, -1, -1, FLAG_CASTLE_Q));
        }
    }
    return out;
};

export const make = (pos, m) => {
    const undo = {
        from: m.from, to: m.to, piece: m.piece, captured: m.captured,
        promo: m.promo, flags: m.flags,
        castle: pos.castling, ep: pos.ep, half: pos.half,
        keyLo: pos.keyLo, keyHi: pos.keyHi,
    };
    const us = pos.side, them = us ^ 1;
    const base = us * 6;

    if (pos.ep >= 0) xorKey(pos, Z_EP[pos.ep & 7]);

    // Remove captured piece (en passant pawn sits beside the target square).
    if (m.captured >= 0) {
        const capSq = (m.flags & FLAG_EP)
            ? (us === WHITE ? m.to + 8 : m.to - 8)
            : m.to;
        clearBit(pos.pieces[m.captured], capSq);
        xorKey(pos, Z_PIECE[m.captured][capSq]);
    }

    // Move (or promote) the piece.
    clearBit(pos.pieces[m.piece], m.from);
    xorKey(pos, Z_PIECE[m.piece][m.from]);
    const placed = m.promo >= 0 ? base + m.promo : m.piece;
    setBit(pos.pieces[placed], m.to);
    xorKey(pos, Z_PIECE[placed][m.to]);
    if (m.piece % 6 === KING) pos.kings[us] = m.to;

    // Castling rook shuffle.
    if (m.flags & (FLAG_CASTLE_K | FLAG_CASTLE_Q)) {
        const rFrom = m.flags & FLAG_CASTLE_K ? (us === WHITE ? 63 : 7) : (us === WHITE ? 56 : 0);
        const rTo = m.flags & FLAG_CASTLE_K ? (us === WHITE ? 61 : 5) : (us === WHITE ? 59 : 3);
        const rookIdx = base + ROOK;
        clearBit(pos.pieces[rookIdx], rFrom);
        setBit(pos.pieces[rookIdx], rTo);
        xorKey(pos, Z_PIECE[rookIdx][rFrom]);
        xorKey(pos, Z_PIECE[rookIdx][rTo]);
    }

    // Castling rights.
    const newCastle = pos.castling & CASTLE_MASK[m.from] & CASTLE_MASK[m.to];
    if (newCastle !== pos.castling) {
        xorKey(pos, Z_CASTLE[pos.castling]);
        xorKey(pos, Z_CASTLE[newCastle]);
        pos.castling = newCastle;
    }

    // En passant target square for double pushes.
    if (m.flags & FLAG_DOUBLE) {
        pos.ep = us === WHITE ? m.from - 8 : m.from + 8;
        xorKey(pos, Z_EP[pos.ep & 7]);
    } else {
        pos.ep = -1;
    }

    pos.half = (m.captured >= 0 || m.piece % 6 === PAWN) ? 0 : pos.half + 1;
    if (us === BLACK) pos.full++;
    pos.side = them;
    xorKey(pos, Z_SIDE);
    pos.undo.push(undo);
};

export const unmake = (pos) => {
    const u = pos.undo.pop();
    if (!u) return;
    pos.side ^= 1;
    const us = pos.side;
    const base = us * 6;

    pos.castling = u.castle;
    pos.ep = u.ep;
    pos.half = u.half;
    pos.keyLo = u.keyLo;
    pos.keyHi = u.keyHi;
    if (us === BLACK) pos.full--;

    const placed = u.promo >= 0 ? base + u.promo : u.piece;
    clearBit(pos.pieces[placed], u.to);
    setBit(pos.pieces[u.piece], u.from);
    if (u.piece % 6 === KING) pos.kings[us] = u.from;

    if (u.captured >= 0) {
        const capSq = (u.flags & FLAG_EP) ? (us === WHITE ? u.to + 8 : u.to - 8) : u.to;
        setBit(pos.pieces[u.captured], capSq);
    }
    if (u.flags & (FLAG_CASTLE_K | FLAG_CASTLE_Q)) {
        const rFrom = u.flags & FLAG_CASTLE_K ? (us === WHITE ? 63 : 7) : (us === WHITE ? 56 : 0);
        const rTo = u.flags & FLAG_CASTLE_K ? (us === WHITE ? 61 : 5) : (us === WHITE ? 59 : 3);
        const rookIdx = base + ROOK;
        setBit(pos.pieces[rookIdx], rFrom);
        clearBit(pos.pieces[rookIdx], rTo);
    }
};

// Legal moves = pseudo moves that do not leave own king attacked.
export const generateLegalMoves = (pos) => {
    const pseudo = generatePseudoMoves(pos);
    const legal = [];
    for (let i = 0; i < pseudo.length; i++) {
        const m = pseudo[i];
        make(pos, m);
        const ok = !isSquareAttacked(pos, pos.kings[pos.side ^ 1], pos.side);
        unmake(pos);
        if (ok) legal.push(m);
    }
    return legal;
};

// ---------- game state ----------
const insufficientMaterial = (pos) => {
    let minors = 0;
    for (let color = 0; color < 2; color++) {
        const base = color * 6;
        if (!isEmpty(pos.pieces[base + PAWN])) return false;
        if (!isEmpty(pos.pieces[base + ROOK])) return false;
        if (!isEmpty(pos.pieces[base + QUEEN])) return false;
        minors += popCount(pos.pieces[base + KNIGHT]) + popCount(pos.pieces[base + BISHOP]);
    }
    return minors <= 1; // K vs K, K+minor vs K
};

export const gameState = (pos) => {
    const moves = generateLegalMoves(pos);
    const inCheck = isInCheck(pos);
    if (moves.length === 0) return inCheck ? 'checkmate' : 'stalemate';
    if (insufficientMaterial(pos)) return 'draw';
    if (pos.half >= 100) return 'draw'; // Fifty-move rule (100 half-moves without capture/pawn move).
    return inCheck ? 'check' : 'playing';
};

// ---------- perft ----------
const perftInner = (pos, depth) => {
    if (depth === 0) return 1;
    const moves = generateLegalMoves(pos);
    if (depth === 1) return moves.length;
    let nodes = 0;
    for (let i = 0; i < moves.length; i++) {
        make(pos, moves[i]);
        nodes += perftInner(pos, depth - 1);
        unmake(pos);
    }
    return nodes;
};
export const perft = (fen, depth) => {
    const pos = fromFen(fen);
    return perftInner(pos, depth);
};

// ---------- move helpers for callers ----------
export const uciOf = (m) =>
    sqToAlgebraic(m.from) + sqToAlgebraic(m.to) + (m.promo >= 0 ? 'pnbrqk'[m.promo] : '');

export const findMoveByUci = (pos, uci) => {
    if (!uci || uci.length < 4) return null;
    const moves = generateLegalMoves(pos);
    return moves.find(m => uciOf(m) === uci) || null;
};

export const MOVE_FLAGS = { DOUBLE: FLAG_DOUBLE, EP: FLAG_EP, CASTLE_K: FLAG_CASTLE_K, CASTLE_Q: FLAG_CASTLE_Q };
export { rcToSq, sqToRow, sqToCol };
