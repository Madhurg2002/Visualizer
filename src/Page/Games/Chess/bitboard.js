// bitboard.js — Bitboard representation layer for the Chess module.
//
// Square mapping matches the array board's row-major layout:
//   sq 0 = a8 ... sq 7 = h8, sq 8 = a7 ... sq 63 = h1
//   sq = row * 8 + col  (row 0 = rank 8, col 0 = file a)
//
// JS bitwise operators are 32-bit, so every 64-square bitboard is a pair of
// 32-bit words { lo, hi }: lo holds bit squares 0..31, hi holds 32..63.

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Piece encoding: color 0 = white ('w'), 1 = black ('b'); type 0..5 = p,n,b,r,q,k.
export const WHITE = 0;
export const BLACK = 1;
export const PAWN = 0;
export const KNIGHT = 1;
export const BISHOP = 2;
export const ROOK = 3;
export const QUEEN = 4;
export const KING = 5;
export const PIECE_CHARS = ['P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k'];
export const CHAR_TO_PIECE = (() => {
    const map = {};
    PIECE_CHARS.forEach((ch, i) => { map[ch] = i; });
    return map;
})();

// Castling right bits (standard): 1 = White O-O, 2 = White O-O-O, 4 = Black O-O, 8 = Black O-O-O.
// Rights start at 15 and are masked per square touched by a move (king/rook/capture squares).
export const CASTLE_MASK = (() => {
    const m = new Array(64).fill(15);
    m[60] = 12; // e1: white loses both
    m[63] = 14; // h1: white loses O-O
    m[56] = 13; // a1: white loses O-O-O
    m[4] = 3;   // e8: black loses both
    m[7] = 11;  // h8: black loses O-O
    m[0] = 7;   // a8: black loses O-O-O
    return m;
})();

// ---------- square helpers ----------
export const rcToSq = (row, col) => row * 8 + col;
export const sqToRow = (sq) => sq >> 3;
export const sqToCol = (sq) => sq & 7;
export const sqToAlgebraic = (sq) => 'abcdefgh'[sq & 7] + (8 - (sq >> 3));
export const algebraicToSq = (str) => {
    const file = 'abcdefgh'.indexOf(str[0]);
    const rank = parseInt(str[1], 10);
    if (file < 0 || !(rank >= 1 && rank <= 8)) return -1;
    return (8 - rank) * 8 + file;
};

// ---------- split-bitboard primitives ----------
export const bb = (lo = 0, hi = 0) => ({ lo, hi });
export const setBit = (b, sq) => {
    if (sq < 32) b.lo |= 1 << sq; else b.hi |= 1 << (sq - 32);
    return b;
};
export const clearBit = (b, sq) => {
    if (sq < 32) b.lo &= ~(1 << sq); else b.hi &= ~(1 << (sq - 32));
    return b;
};
export const getBit = (b, sq) => (sq < 32 ? (b.lo >>> sq) & 1 : (b.hi >>> (sq - 32)) & 1);
export const orBB = (a, b) => bb(a.lo | b.lo, a.hi | b.hi);
export const andBB = (a, b) => bb(a.lo & b.lo, a.hi & b.hi);
export const xorBB = (a, b) => bb(a.lo ^ b.lo, a.hi ^ b.hi);
// NOTE: not with 32-bit ~ leaves sign bits, but results are always ANDed with
// valid-square masks downstream, so andNot is safe.
export const andNot = (a, b) => bb(a.lo & ~b.lo, a.hi & ~b.hi);
export const isEmpty = (b) => (b.lo | b.hi) === 0;

function popCount32(x) {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    x = (x + (x >>> 4)) & 0x0f0f0f0f;
    return (x * 0x01010101) >>> 24;
}
export const popCount = (b) => popCount32(b.lo) + popCount32(b.hi);

function lsb32(x) {
    return 31 - Math.clz32(x & -x); // x !== 0
}
// Index of lowest set bit, or -1 when empty.
export const lsbSq = (b) => (b.lo !== 0 ? lsb32(b.lo) : b.hi !== 0 ? 32 + lsb32(b.hi) : -1);
// Pop lowest set bit in place, returning its square (-1 when empty).
export const popLsb = (b) => {
    if (b.lo !== 0) {
        const sq = lsb32(b.lo);
        b.lo &= b.lo - 1;
        return sq;
    }
    if (b.hi !== 0) {
        const sq = 32 + lsb32(b.hi);
        b.hi &= b.hi - 1;
        return sq;
    }
    return -1;
};
export const copyBB = (b) => ({ lo: b.lo, hi: b.hi });

// ---------- precomputed attack tables ----------
const KNIGHT_DELTAS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_DELTAS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

function buildTable(deltas) {
    const table = new Array(64);
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const b = bb();
            for (const [dr, dc] of deltas) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) setBit(b, rcToSq(nr, nc));
            }
            table[rcToSq(r, c)] = b;
        }
    }
    return table;
}
export const KNIGHT_ATT = buildTable(KNIGHT_DELTAS);
export const KING_ATT = buildTable(KING_DELTAS);

// Squares a pawn standing on sq attacks (per color). White attacks NW/NE (sq-9/sq-7).
export const PAWN_ATT_W = buildTable([[-1, -1], [-1, 1]]);
export const PAWN_ATT_B = buildTable([[1, -1], [1, 1]]);

// Ray tables: RAYS[sq][dir] = squares outward from sq, in order.
// dirs: 0=N 1=S 2=E 3=W 4=NE 5=NW 6=SE 7=SW (N is toward rank 8, i.e. smaller sq).
const DIR_DELTAS = [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [-1, -1], [1, 1], [1, -1]];
export const RAYS = (() => {
    const rays = new Array(64);
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const perSq = new Array(8);
            for (let d = 0; d < 8; d++) {
                const list = [];
                let nr = r + DIR_DELTAS[d][0], nc = c + DIR_DELTAS[d][1];
                while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    list.push(rcToSq(nr, nc));
                    nr += DIR_DELTAS[d][0];
                    nc += DIR_DELTAS[d][1];
                }
                perSq[d] = list;
            }
            rays[rcToSq(r, c)] = perSq;
        }
    }
    return rays;
})();

// Sliding attacks via ray walk (first blocker included, then stop).
function rayAttack(sq, dir, occ) {
    const ray = RAYS[sq][dir];
    const out = bb();
    for (let i = 0; i < ray.length; i++) {
        const s = ray[i];
        setBit(out, s);
        if (getBit(occ, s)) break;
    }
    return out;
}
export const rookAttacks = (sq, occ) => {
    const out = bb();
    const rays = RAYS[sq];
    for (let d = 0; d < 4; d++) {
        const ray = rays[d];
        for (let i = 0; i < ray.length; i++) {
            const s = ray[i];
            setBit(out, s);
            if (getBit(occ, s)) break;
        }
    }
    return out;
};
export const bishopAttacks = (sq, occ) => {
    const out = bb();
    const rays = RAYS[sq];
    for (let d = 4; d < 8; d++) {
        const ray = rays[d];
        for (let i = 0; i < ray.length; i++) {
            const s = ray[i];
            setBit(out, s);
            if (getBit(occ, s)) break;
        }
    }
    return out;
};
export const queenAttacks = (sq, occ) => orBB(rookAttacks(sq, occ), bishopAttacks(sq, occ));

// ---------- position <-> FEN ----------
// A position is the authoritative engine state:
//   pieces: 12 bitboards indexed color * 6 + type
//   side: 0 (white) or 1 (black) to move
//   castling: 4-bit rights mask, ep: en-passant target square or -1
//   half/full: clocks, kings: [whiteKingSq, blackKingSq]
//   keyLo/keyHi: zobrist hash (maintained by bbEngine.make/unmake)
export const newPosition = () => ({
    pieces: Array.from({ length: 12 }, () => bb()),
    side: WHITE,
    castling: 15,
    ep: -1,
    half: 0,
    full: 1,
    kings: [-1, -1],
    keyLo: 0,
    keyHi: 0,
    undo: [],
});

export const fromFen = (fen) => {
    const pos = newPosition();
    const parts = fen.trim().split(/\s+/);
    const rows = parts[0].split('/');
    if (rows.length !== 8) throw new Error('Bad FEN board: ' + fen);
    for (let r = 0; r < 8; r++) {
        let c = 0;
        for (const ch of rows[r]) {
            if (ch >= '1' && ch <= '8') {
                c += parseInt(ch, 10);
            } else {
                const idx = CHAR_TO_PIECE[ch];
                if (idx === undefined) throw new Error('Bad FEN piece: ' + ch);
                const sq = rcToSq(r, c);
                setBit(pos.pieces[idx], sq);
                if ((idx % 6) === KING) pos.kings[idx < 6 ? WHITE : BLACK] = sq;
                c++;
            }
        }
        if (c !== 8) throw new Error('Bad FEN rank: ' + rows[r]);
    }
    pos.side = parts[1] === 'b' ? BLACK : WHITE;
    pos.castling = 0;
    if (parts[2] && parts[2] !== '-') {
        if (parts[2].includes('K')) pos.castling |= 1;
        if (parts[2].includes('Q')) pos.castling |= 2;
        if (parts[2].includes('k')) pos.castling |= 4;
        if (parts[2].includes('q')) pos.castling |= 8;
    }
    pos.ep = parts[3] && parts[3] !== '-' ? algebraicToSq(parts[3]) : -1;
    pos.half = parts[4] ? parseInt(parts[4], 10) || 0 : 0;
    pos.full = parts[5] ? parseInt(parts[5], 10) || 1 : 1;
    return pos;
};

export const toFen = (pos) => {
    let board = '';
    for (let r = 0; r < 8; r++) {
        let empty = 0;
        for (let c = 0; c < 8; c++) {
            const sq = rcToSq(r, c);
            let piece = -1;
            for (let i = 0; i < 12; i++) {
                if (getBit(pos.pieces[i], sq)) { piece = i; break; }
            }
            if (piece === -1) {
                empty++;
            } else {
                if (empty > 0) { board += empty; empty = 0; }
                board += PIECE_CHARS[piece];
            }
        }
        if (empty > 0) board += empty;
        if (r < 7) board += '/';
    }
    let castling = '';
    if (pos.castling & 1) castling += 'K';
    if (pos.castling & 2) castling += 'Q';
    if (pos.castling & 4) castling += 'k';
    if (pos.castling & 8) castling += 'q';
    return `${board} ${pos.side === BLACK ? 'b' : 'w'} ${castling || '-'} ${pos.ep >= 0 ? sqToAlgebraic(pos.ep) : '-'} ${pos.half} ${pos.full}`;
};

// ---------- position <-> legacy array board ----------
// Array piece shape: { type: 'p'|'n'|'b'|'r'|'q'|'k', color: 'w'|'b', hasMoved } | null
const TYPE_CHARS = ['p', 'n', 'b', 'r', 'q', 'k'];
const HOME = { p: { w: 6, b: 1 }, n: { w: 63, b: 7 }, b: { w: 58, b: 2 }, r: { w: 56, b: 0 }, q: { w: 59, b: 3 }, k: { w: 60, b: 4 } };

export const fromBoardArray = (board, turn = 'w', lastMove = null) => {
    const pos = newPosition();
    pos.side = turn === 'b' ? BLACK : WHITE;
    pos.castling = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) continue;
            const color = p.color === 'b' ? BLACK : WHITE;
            const type = TYPE_CHARS.indexOf(p.type);
            if (type < 0) throw new Error('Unknown piece type: ' + p.type);
            const sq = rcToSq(r, c);
            setBit(pos.pieces[color * 6 + type], sq);
            if (type === KING) pos.kings[color] = sq;
            // Derive castling rights from king/rook presence + hasMoved flags.
            if (p.hasMoved !== true) {
                if (type === KING && sq === HOME.k[color === WHITE ? 'w' : 'b']) {
                    pos.castling |= color === WHITE ? 3 : 12;
                } else if (type === ROOK) {
                    if (color === WHITE && sq === 63) pos.castling |= 1;
                    else if (color === WHITE && sq === 56) pos.castling |= 2;
                    else if (color === BLACK && sq === 7) pos.castling |= 4;
                    else if (color === BLACK && sq === 0) pos.castling |= 8;
                }
            }
        }
    }
    // En-passant target from a recorded double pawn push.
    if (lastMove && lastMove.isDoubleJump && lastMove.piece && lastMove.piece.type === 'p' && lastMove.from && lastMove.to) {
        pos.ep = rcToSq((lastMove.from.row + lastMove.to.row) / 2, lastMove.to.col);
    }
    return pos;
};

export const toBoardArray = (pos) => {
    const board = [];
    for (let r = 0; r < 8; r++) {
        const row = new Array(8).fill(null);
        for (let c = 0; c < 8; c++) {
            const sq = rcToSq(r, c);
            for (let i = 0; i < 12; i++) {
                if (getBit(pos.pieces[i], sq)) {
                    const color = i < 6 ? 'w' : 'b';
                    const type = TYPE_CHARS[i % 6];
                    const homeSq = HOME[type][color === 'w' ? 'w' : 'b'];
                    row[c] = { type, color, hasMoved: sq !== homeSq };
                    break;
                }
            }
        }
        board.push(row);
    }
    return board;
};
