// logic.js — Array-board facade over the bitboard engine.
//
// The UI (ChessGame.jsx / Online.js / pgnUtils.js) keeps working on the legacy
// 8x8 array of { type, color, hasMoved } pieces. All *validation* (legal move
// generation, check/checkmate/stalemate detection) is delegated to the split
// 32-bit bitboard engine in bitboard.js + bbEngine.js, so rules live in one
// place and the array board is only a rendering/interop format.
import {
    WHITE, BLACK, rcToSq, sqToRow, sqToCol,
    fromBoardArray, toBoardArray,
} from './bitboard';
import {
    MOVE_FLAGS, generatePseudoMoves, generateLegalMoves,
    isInCheck, gameState as engineGameState, initKey,
} from './bbEngine';

// ---------- Initial Board Setup ----------
export const initialBoard = [
    [
        { type: 'r', color: 'b', hasMoved: false }, { type: 'n', color: 'b', hasMoved: false }, { type: 'b', color: 'b', hasMoved: false }, { type: 'q', color: 'b', hasMoved: false },
        { type: 'k', color: 'b', hasMoved: false }, { type: 'b', color: 'b', hasMoved: false }, { type: 'n', color: 'b', hasMoved: false }, { type: 'r', color: 'b', hasMoved: false }
    ],
    [
        { type: 'p', color: 'b', hasMoved: false }, { type: 'p', color: 'b', hasMoved: false }, { type: 'p', color: 'b', hasMoved: false }, { type: 'p', color: 'b', hasMoved: false },
        { type: 'p', color: 'b', hasMoved: false }, { type: 'p', color: 'b', hasMoved: false }, { type: 'p', color: 'b', hasMoved: false }, { type: 'p', color: 'b', hasMoved: false }
    ],
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    [
        { type: 'p', color: 'w', hasMoved: false }, { type: 'p', color: 'w', hasMoved: false }, { type: 'p', color: 'w', hasMoved: false }, { type: 'p', color: 'w', hasMoved: false },
        { type: 'p', color: 'w', hasMoved: false }, { type: 'p', color: 'w', hasMoved: false }, { type: 'p', color: 'w', hasMoved: false }, { type: 'p', color: 'w', hasMoved: false }
    ],
    [
        { type: 'r', color: 'w', hasMoved: false }, { type: 'n', color: 'w', hasMoved: false }, { type: 'b', color: 'w', hasMoved: false }, { type: 'q', color: 'w', hasMoved: false },
        { type: 'k', color: 'w', hasMoved: false }, { type: 'b', color: 'w', hasMoved: false }, { type: 'n', color: 'w', hasMoved: false }, { type: 'r', color: 'w', hasMoved: false }
    ]
];

export const getPieceType = (piece) => piece ? piece.type : null;
export const getPieceColor = (piece) => piece ? piece.color : null;

export const isValidSquare = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;
export const isSameColor = (piece, targetPiece) => piece && targetPiece && piece.color === targetPiece.color;
export const isOpponent = (piece, targetPiece) => piece && targetPiece && piece.color !== targetPiece.color;

// ---------- Engine move -> UI move shape ----------
// Engine move: { from, to, piece, captured, promo, flags } (squares 0..63).
// UI move:     { row, col, capture, isPromotion, ... } (row/col on the array board).
const FLAG_DOUBLE = MOVE_FLAGS.DOUBLE, FLAG_EP = MOVE_FLAGS.EP;
const FLAG_CASTLES = MOVE_FLAGS.CASTLE_K | MOVE_FLAGS.CASTLE_Q;

const engineMoveToUi = (m) => ({
    row: sqToRow(m.to),
    col: sqToCol(m.to),
    capture: m.captured >= 0,
    isPromotion: m.promo >= 0,
    promotionType: m.promo >= 0 ? 'pnbrqk'[m.promo] : undefined,
    isEnPassant: (m.flags & FLAG_EP) !== 0,
    isDoubleJump: (m.flags & FLAG_DOUBLE) !== 0,
    isCastling: (m.flags & FLAG_CASTLES) !== 0,
});

// Pseudo-legal moves for the piece at (row, col) — kept for mobility heuristics.
export const getPossibleMoves = (board, row, col, lastMove) => {
    const piece = board[row] && board[row][col];
    if (!piece) return [];
    const pos = fromBoardArray(board, piece.color, lastMove);
    const from = rcToSq(row, col);
    const moves = generatePseudoMoves(pos);
    const out = [];
    for (let i = 0; i < moves.length; i++) {
        if (moves[i].from === from) out.push(engineMoveToUi(moves[i]));
    }
    return out;
};

// Fully legal moves for the piece at (row, col) (engine-verified, pins included).
export const getValidMoves = (board, row, col, lastMove) => {
    const piece = board[row] && board[row][col];
    if (!piece) return [];
    const pos = fromBoardArray(board, piece.color, lastMove);
    const from = rcToSq(row, col);
    const moves = generateLegalMoves(pos);
    const out = [];
    for (let i = 0; i < moves.length; i++) {
        if (moves[i].from === from) out.push(engineMoveToUi(moves[i]));
    }
    return out;
};

// ---------- King / check helpers ----------
export const findKing = (board, color) => {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.type === 'k' && piece.color === color) {
                return { row: r, col: c };
            }
        }
    }
    return null;
};

// Squares attacked by sliding pieces (rook/queen orth, bishop/queen diag).
const isSlidingAttacked = (board, row, col, opponentColor, types, dirs) => {
    for (let [dr, dc] of dirs) {
        for (let i = 1; i < 8; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (!isValidSquare(r, c)) break;
            const p = board[r][c];
            if (p) {
                if (p.color === opponentColor && types.includes(p.type)) return true;
                break;
            }
        }
    }
    return false;
};

const JUMPS = {
    knight: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
    king: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
    orth: [[-1, 0], [1, 0], [0, -1], [0, 1]],
    diag: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
};

// Check if a square is under attack by opponent (array-board helper for UI code).
export const isSquareAttacked = (board, row, col, opponentColor) => {
    const pawnDir = opponentColor === 'w' ? -1 : 1;
    const attackRow = row - pawnDir;
    for (const dc of [-1, 1]) {
        if (isValidSquare(attackRow, col + dc)) {
            const p = board[attackRow][col + dc];
            if (p && p.color === opponentColor && p.type === 'p') return true;
        }
    }
    for (const [dr, dc] of JUMPS.knight) {
        if (isValidSquare(row + dr, col + dc)) {
            const p = board[row + dr][col + dc];
            if (p && p.color === opponentColor && p.type === 'n') return true;
        }
    }
    for (const [dr, dc] of JUMPS.king) {
        if (isValidSquare(row + dr, col + dc)) {
            const p = board[row + dr][col + dc];
            if (p && p.color === opponentColor && p.type === 'k') return true;
        }
    }
    return isSlidingAttacked(board, row, col, opponentColor, ['r', 'q'], JUMPS.orth)
        || isSlidingAttacked(board, row, col, opponentColor, ['b', 'q'], JUMPS.diag);
};

export const isCheck = (board, color) => {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;
    return isSquareAttacked(board, kingPos.row, kingPos.col, color === 'w' ? 'b' : 'w');
};

// ---------- Game state (engine-driven) ----------
// Returns 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'.
// Pass `boardHistory` (array of boards, entry 0 = initial position with white
// to move) to enable the threefold-repetition and fifty-move draw rules. The
// current position may be the last history entry (as in ChessGame) or omitted.
// Without history these rules are not evaluated (engine still reports material draws).

// Zobrist key of a board position (identity includes side; castling rights are
// derived from hasMoved flags, ep from the recorded last move when available).
const positionKey = (board, turn, lastMove) => {
    const pos = initKey(fromBoardArray(board, turn, lastMove));
    return [pos.keyLo, pos.keyHi];
};

// Halfmove clock: plies since the last capture or pawn move, derived from the
// board history (a capture changes piece count; a pawn move changes pawn placement).
const halfClockFromHistory = (boardHistory) => {
    let half = 0;
    for (let i = boardHistory.length - 1; i > 0; i--) {
        const prev = boardHistory[i - 1], cur = boardHistory[i];
        let countPrev = 0, countCur = 0, pawnDiff = false;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const a = prev[r][c], b = cur[r][c];
                if (a) countPrev++;
                if (b) countCur++;
                if ((a && a.type === 'p') !== (b && b.type === 'p')) pawnDiff = true;
            }
        }
        if (countPrev !== countCur || pawnDiff) half++;
        else break;
    }
    return half;
};

const evaluateGameState = (board, turn, lastMove, boardHistory) => {
    const state = engineGameState(fromBoardArray(board, turn, lastMove));
    if (state !== 'playing' && state !== 'check') return state;
    if (!boardHistory || boardHistory.length < 2) return state;

    // Fifty-move rule: 100 half-moves without capture or pawn move.
    if (halfClockFromHistory(boardHistory) >= 100) return 'draw';

    // Threefold repetition: count history entries with the same Zobrist key as
    // the current position, adding 1 for the current position itself unless it
    // is already the last history entry.
    const [curLo, curHi] = positionKey(board, turn, lastMove);
    let count = 0;
    for (let i = 0; i < boardHistory.length; i++) {
        const histTurn = i % 2 === 0 ? 'w' : 'b';
        const [lo, hi] = positionKey(boardHistory[i], histTurn, null);
        if (lo === curLo && hi === curHi) count++;
    }
    const n = boardHistory.length;
    const lastTurn = (n - 1) % 2 === 0 ? 'w' : 'b';
    const [lastLo, lastHi] = positionKey(boardHistory[n - 1], lastTurn, null);
    if (!(lastLo === curLo && lastHi === curHi)) count++;
    if (count >= 3) return 'draw';

    return state;
};

export const checkGameState = (board, turn, lastMove, boardHistory = null) =>
    evaluateGameState(board, turn, lastMove, boardHistory);

// ---------- Move application ----------
// Apply a move to the array board (single source of truth for the UI) and
// evaluate the resulting state with the bitboard engine.
//
// `boardHistory` (optional): all prior boards INCLUDING the pre-move position
// (entry 0 = initial board, white to move). Enables repetition/50-move draws.
//
// Returns { board, turn, state, lastMove, notation, thisMove } plus legacy
// aliases (newBoard/nextTurn/newState) so both call styles keep working.
export const executeMove = (board, turn, fromRow, fromCol, toRow, toCol, moveDetails = {}, boardHistory = null) => {
    const moving = board[fromRow] && board[fromRow][fromCol];
    if (!moving) return null;

    // Re-derive special move types from geometry (robust against stale flags).
    const isCastling = moving.type === 'k' && Math.abs(toCol - fromCol) === 2;
    const isDoubleJump = moving.type === 'p' && Math.abs(toRow - fromRow) === 2;
    const isEnPassant = moving.type === 'p' && !board[toRow][toCol] && fromCol !== toCol;
    const promotionRow = turn === 'w' ? 0 : 7;
    const isPromotion = moving.type === 'p' && toRow === promotionRow;
    const promotionType = isPromotion ? (moveDetails.promotionType || 'q') : undefined;
    const target = board[toRow][toCol];
    const isCapture = !!target || isEnPassant;

    const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
    const movingPiece = { ...newBoard[fromRow][fromCol], hasMoved: true };
    if (isPromotion) movingPiece.type = promotionType;
    newBoard[fromRow][fromCol] = null;
    newBoard[toRow][toCol] = movingPiece;

    if (isCastling) {
        if (toCol > fromCol) { // Kingside: rook h->f
            const rook = newBoard[fromRow][7];
            newBoard[fromRow][7] = null;
            newBoard[fromRow][5] = { ...rook, hasMoved: true };
        } else { // Queenside: rook a->d
            const rook = newBoard[fromRow][0];
            newBoard[fromRow][0] = null;
            newBoard[fromRow][3] = { ...rook, hasMoved: true };
        }
    }

    if (isEnPassant) {
        newBoard[fromRow][toCol] = null;
    }

    const thisMove = {
        piece: movingPiece,
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        isDoubleJump,
        isCapture,
        isCastling,
        isPromotion,
        promotionType,
        isEnPassant,
    };

    const nextTurn = turn === 'w' ? 'b' : 'w';
    const state = evaluateGameState(
        newBoard, nextTurn, thisMove,
        boardHistory ? [...boardHistory, newBoard] : null
    );
    const notation = getAlgebraicNotation(thisMove, board, state === 'check', state === 'checkmate');

    return {
        board: newBoard, newBoard,
        turn: nextTurn, nextTurn,
        state, newState: state,
        lastMove: thisMove, thisMove,
        notation,
    };
};

// ---------- Algebraic notation ----------
export const getAlgebraicNotation = (move, board, isCheck, isCheckmate) => {
    const { from, to, piece, isCastling, isPromotion, promotionType, isCapture } = move;

    if (isCastling) {
        const suffix = isCheckmate ? '#' : isCheck ? '+' : '';
        return (to.col > from.col ? "O-O" : "O-O-O") + suffix;
    }

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const fromFile = files[from.col];
    const toFile = files[to.col];
    const toRank = ranks[to.row];

    let notation = "";

    if (piece.type !== 'p') {
        notation += piece.type.toUpperCase();
        // Disambiguation: another piece of the same type/color can reach `to`.
        const rivals = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r === from.row && c === from.col) continue;
                const p = board[r][c];
                if (!p || p.color !== piece.color || p.type !== piece.type) continue;
                const moves = getValidMoves(board, r, c, null);
                if (moves.some(m => m.row === to.row && m.col === to.col)) rivals.push({ r, c });
            }
        }
        if (rivals.length > 0) {
            const sameFile = rivals.some(x => x.c === from.col);
            const sameRank = rivals.some(x => x.r === from.row);
            if (!sameFile) notation += fromFile;
            else if (!sameRank) notation += ranks[from.row];
            else notation += fromFile + ranks[from.row];
        }
    } else if (isCapture) {
        notation += fromFile;
    }

    if (isCapture) notation += "x";
    notation += toFile + toRank;

    if (isPromotion) notation += "=" + (promotionType || 'Q').toUpperCase();

    if (isCheckmate) notation += "#";
    else if (isCheck) notation += "+";

    return notation;
};

// ---------- FEN ----------
export const boardToFen = (board, turn, castling = { w: { k: true, q: true }, b: { k: true, q: true } }, enPassant = '-', halfMove = 0, fullMove = 1) => {
    let fen = "";
    for (let r = 0; r < 8; r++) {
        let empty = 0;
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) {
                empty++;
            } else {
                if (empty > 0) {
                    fen += empty;
                    empty = 0;
                }
                fen += p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
            }
        }
        if (empty > 0) fen += empty;
        if (r < 7) fen += "/";
    }

    fen += ` ${turn} `;

    let castlingStr = "";
    if (castling.w.k) castlingStr += "K";
    if (castling.w.q) castlingStr += "Q";
    if (castling.b.k) castlingStr += "k";
    if (castling.b.q) castlingStr += "q";
    fen += (castlingStr || "-");

    fen += ` ${enPassant} ${halfMove} ${fullMove}`;
    return fen;
};

// Round-trip helper for tooling/tests: array board -> engine position.
export const boardToPosition = (board, turn = 'w', lastMove = null) =>
    fromBoardArray(board, turn, lastMove);
export const positionToBoard = toBoardArray;
