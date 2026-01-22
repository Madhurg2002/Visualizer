import { getValidMoves, getPossibleMoves, checkGameState, getPieceType, getPieceColor } from './logic';

// Piece Values
const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

// Positional Tables (Simplified for Black side, need mirroring for White if AI plays White)
// Higher numbers = better position
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

// Evaluate the board from the perspective of the side to move (or absolute score)
// Checks: Material, Position
// Evaluate the board
// Add Mobility and Endgame heuristics
export const evaluateBoard = (board) => {
    let score = 0;
    let whiteMaterial = 0;
    let blackMaterial = 0;

    // Material & Position
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                const { type, color } = piece;
                const value = PIECE_VALUES[type] || 0;

                // Track material for endgame detection
                if (type !== 'k' && type !== 'p') {
                    if (color === 'w') whiteMaterial += value;
                    else blackMaterial += value;
                }

                // MST Position
                let posValue = 0;
                if (MST[type]) {
                    // Use Endgame King Table if material is low
                    // Simple logic: if < 1500 material (e.g. just Rook + Minor), King should activate
                    if (type === 'k') {
                        const isEndgame = (color === 'w' ? blackMaterial : whiteMaterial) < 1500;
                        if (isEndgame) {
                            // Simple activating heuristic: separate table or just invert center logic
                            // For simplicity using existing table but maybe boost it?
                            // Or use a specific Endgame Table (adding later if needed).
                            // For now, let's just stick to MST but maybe add center-proximity bonus in endgame?
                        }
                    }

                    if (color === 'w') {
                        posValue = MST[type][r][c];
                    } else {
                        posValue = MST[type][7 - r][c];
                    }
                }

                if (color === 'w') {
                    score += (value + posValue);
                } else {
                    score -= (value + posValue);
                }
            }
        }
    }

    // Mobility (Pseudo-legal moves count) - Small bonus per available move
    // This encourages developing pieces and controlling space.
    // Performance note: getPossibleMoves is faster than getValidMoves (no check simulation).
    // We sample mobility for both sides.
    const whiteMobility = countMobility(board, 'w');
    const blackMobility = countMobility(board, 'b');

    score += (whiteMobility * 5); // 5 points per pseudo-legal move (0.05 pawn)
    score -= (blackMobility * 5);

    return score;
};

const countMobility = (board, color) => {
    let count = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] && board[r][c].color === color) {
                const moves = getPossibleMoves(board, r, c, null); // lastMove null for approx
                count += moves.length;
            }
        }
    }
    return count;
};

// Transposition Table
const transpositionTable = new Map();

// Helper: Generate a unique signature for the board
const getBoardSignature = (board, turn) => {
    // fast character mapping
    let sig = turn + ':';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p) sig += `${p.color}${p.type}${r}${c}`;
        }
    }
    return sig;
};

// Minimax with Alpha-Beta Pruning
export const getBestMove = (board, depth, isMaximizingPlayer, lastMove) => {
    // Clear TT for new turn to ensure freshness (or keep if implementing iterative deepening later)
    // For now, simple clear to manage memory
    transpositionTable.clear();

    // Basic iterative deepening could go here, but fixed depth for now
    // Depth 3 is usually okay for JS (plies)

    const possibleMoves = getAllMoves(board, isMaximizingPlayer ? 'w' : 'b', lastMove);

    // Check Game Over or Depth 0
    if (depth === 0 || possibleMoves.length === 0) {
        // If no moves, check logic handles checkmate/stalemate... 
        // We can just eval board. 
        // But if checkmate, score should be infinite.
        // Let's rely on basic eval first.
        return { score: evaluateBoard(board) };
        // Ideally: checkGameState(board) -> if checkmate return +/- Infinity
    }

    // Ordering: captures first? (For alpha-beta efficiency)

    let bestMove = null;
    let bestScore = isMaximizingPlayer ? -Infinity : Infinity;

    // Sort moves simply? (Capture moves helps)
    possibleMoves.sort((a, b) => (b.capture ? 1 : 0) - (a.capture ? 1 : 0));

    for (const move of possibleMoves) {
        // Simulate Move
        const nextBoard = board.map(r => r.map(c => c ? { ...c } : null));

        // Simplified move exec (missing castling logic in simulation for speed? No, keep logic correct)
        // ...Actually we should likely duplicate logic.js executeMove code or refactor it out.
        // For AI v1: simple move.
        const movingPiece = { ...nextBoard[move.from.row][move.from.col], hasMoved: true };
        nextBoard[move.from.row][move.from.col] = null;
        nextBoard[move.to.row][move.to.col] = movingPiece;

        // Recursion
        // If we are Max (White), next is Min (Black).
        const result = minimax(nextBoard, depth - 1, -Infinity, Infinity, !isMaximizingPlayer, move);

        if (isMaximizingPlayer) {
            if (result > bestScore) {
                bestScore = result;
                bestMove = move;
            }
        } else {
            if (result < bestScore) {
                bestScore = result;
                bestMove = move;
            }
        }
    }

    return { move: bestMove, score: bestScore };
};

// Helper: Minimax recursive body
const minimax = (board, depth, alpha, beta, isMaximizingPlayer, lastMove) => {
    const turn = isMaximizingPlayer ? 'w' : 'b';
    const boardSig = getBoardSignature(board, turn);
    const alphaOriginal = alpha;

    // 1. Memoization / Transposition Table Lookup
    if (transpositionTable.has(boardSig)) {
        const entry = transpositionTable.get(boardSig);
        if (entry.depth >= depth) {
            if (entry.type === 'exact') return entry.score;
            if (entry.type === 'lower' && entry.score > alpha) alpha = entry.score;
            else if (entry.type === 'upper' && entry.score < beta) beta = entry.score;
            if (alpha >= beta) return entry.score;
        }
    }

    if (depth === 0) {
        // Use Quiescence Search at leaf nodes to solve horizon effect
        const val = quiescence(board, alpha, beta, isMaximizingPlayer, lastMove);
        transpositionTable.set(boardSig, { score: val, depth, type: 'exact' });
        return val;
    }

    const moves = getAllMoves(board, turn, lastMove);

    if (moves.length === 0) {
        // strictly check for checkmate vs stalemate
        if (checkGameState(board, turn, lastMove) === 'checkmate') {
            return isMaximizingPlayer ? -90000 : 90000;
        }
        return 0; // Stalemate
    }

    // Move Ordering: Captures > Checks (if possible) > History
    moves.sort((a, b) => (b.capture ? 10 : 0) - (a.capture ? 10 : 0));

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const nextBoard = simulateMove(board, move);
            const ev = minimax(nextBoard, depth - 1, alpha, beta, false, move);
            maxEval = Math.max(maxEval, ev);
            alpha = Math.max(alpha, ev);
            if (beta <= alpha) break;
        }

        // Store in TT
        const type = maxEval <= alphaOriginal ? 'upper' : (maxEval >= beta ? 'lower' : 'exact');
        transpositionTable.set(boardSig, { score: maxEval, depth, type });

        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const nextBoard = simulateMove(board, move);
            const ev = minimax(nextBoard, depth - 1, alpha, beta, true, move);
            minEval = Math.min(minEval, ev);
            beta = Math.min(beta, ev);
            if (beta <= alpha) break;
        }

        // Store in TT
        const type = minEval <= alphaOriginal ? 'upper' : (minEval >= beta ? 'lower' : 'exact');
        transpositionTable.set(boardSig, { score: minEval, depth, type });

        return minEval;
    }
};

// Quiescence Search: Keep searching captures to avoid horizon effect
const quiescence = (board, alpha, beta, isMaximizingPlayer, lastMove) => {
    const standPat = evaluateBoard(board);

    if (isMaximizingPlayer) {
        if (standPat >= beta) return beta;
        if (alpha < standPat) alpha = standPat;
    } else {
        if (standPat <= alpha) return alpha;
        if (beta > standPat) beta = standPat;
    }

    // Generate only capture moves
    const inputMoves = getAllMoves(board, isMaximizingPlayer ? 'w' : 'b', lastMove); // Optimization: pass flag to only generate captures?
    const captureMoves = inputMoves.filter(m => m.capture);

    // Sort captures by value (MVV-LVA) - simplified: just capture flag (already true), maybe capture value?
    // For now assuming getAllMoves uses default order, but we should sort High Capture first.
    // move.piece is attacker, we need victim. Victim is on board[move.to].
    // Note: getAllMoves simulated board logic, 'to' might be empty in checking? No, getAllMoves uses current board.

    captureMoves.sort((a, b) => {
        // Victim value
        const vA = getPieceValue(board[a.to.row][a.to.col]); // This might need helper
        const vB = getPieceValue(board[b.to.row][b.to.col]);
        return vB - vA;
    });

    if (isMaximizingPlayer) {
        for (const move of captureMoves) {
            const nextBoard = simulateMove(board, move);
            const score = quiescence(nextBoard, alpha, beta, false, move);

            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        }
        return alpha;
    } else {
        for (const move of captureMoves) {
            const nextBoard = simulateMove(board, move);
            const score = quiescence(nextBoard, alpha, beta, true, move);

            if (score <= alpha) return alpha;
            if (score < beta) beta = score;
        }
        return beta;
    }
};

const getPieceValue = (piece) => {
    if (!piece) return 0;
    return PIECE_VALUES[piece.type] || 0;
};

// Helper: Get all valid moves for a color
const getAllMoves = (board, color, lastMove) => {
    let allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === color) {
                const moves = getValidMoves(board, r, c, lastMove);
                // Attach 'from' to move, getValidMoves only gives 'to' (and capture flags)
                // getValidMoves returns [{row, col, ...}]
                moves.forEach(m => {
                    allMoves.push({
                        from: { row: r, col: c },
                        to: { row: m.row, col: m.col },
                        piece: piece,
                        ...m
                    });
                });
            }
        }
    }
    return allMoves;
};

// Helper: Simulate Move directly
const simulateMove = (board, move) => {
    const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
    const piece = newBoard[move.from.row][move.from.col];

    piece.hasMoved = true;
    newBoard[move.from.row][move.from.col] = null;
    newBoard[move.to.row][move.to.col] = piece;

    // Basic logic for castling/en passant simulation in AI?
    // For depth 3, maybe strict accuracy isn't 100% required if we just want "a move", 
    // but better to be correct.
    // Logic from index.js:
    if (move.isCastling) {
        const row = move.from.row;
        if (move.side === 'king') {
            const rook = newBoard[row][move.from.col + 3]; // +3 from king? Logic check...
            // logic.js: col+3 is rook. King moves to col+2.
            // move.to.col is col+2.
            // Move rook
            newBoard[row][move.from.col + 1] = null; // Wait, board[row][col+3] is rook.
            // Actually index.js does:
            // const rook = newBoard[row][col + 1]; (Wait, that was bug? No logic.js checks col+3 for rook)
            // index.js: 
            // if (move.side === 'king') { const rook = newBoard[row][col + 1]; ... } 
            // This looks like index.js assumes rook is at col+1 ? No, standard chess rook is at col 7 (h). King at 4 (e).
            // King to 6 (g). Rook to 5 (f).
            // Logic.js generation: row, col+3 (h-file). Target King: col+2 (g).

            // In index.js: 
            // const rook = newBoard[row][col + 1]; // THIS MIGHT BE WRONG in index.js if it assumes rook IS ALREADY there? 
            // NO, index.js: newBoard[row][col + 1] = null; newBoard[row][col - 1] = ...
            // Wait, index.js logic for castling might be buggy if I didn't verify closely. 
            // Let's implement correct logic here.

            // King Side Castling: King e1->g1 (col 4->6). Rook h1->f1 (col 7->5).
            if (move.to.col > move.from.col) { // Kingside
                const oldRookPos = { r: row, c: 7 };
                const newRookPos = { r: row, c: 5 };
                if (newBoard[oldRookPos.r][oldRookPos.c]) {
                    const r = newBoard[oldRookPos.r][oldRookPos.c];
                    newBoard[oldRookPos.r][oldRookPos.c] = null;
                    newBoard[newRookPos.r][newRookPos.c] = r;
                }
            } else { // Queenside e1->c1 (4->2). Rook a1->d1 (0->3).
                const oldRookPos = { r: row, c: 0 };
                const newRookPos = { r: row, c: 3 };
                if (newBoard[oldRookPos.r][oldRookPos.c]) {
                    const r = newBoard[oldRookPos.r][oldRookPos.c];
                    newBoard[oldRookPos.r][oldRookPos.c] = null;
                    newBoard[newRookPos.r][newRookPos.c] = r;
                }
            }
        }
    }
    // En Passant
    if (move.isEnPassant) {
        // Remove captured pawn
        // If White (moving up -1), captured pawn is "behind" the new pos? No, it's at [row][to.col]
        // Actually pawn moves to [r-1][c], captures [r][c].
        const captureRow = move.from.row; // The row the pawn WAS on? En Passant captures pawn on SAME RANK as start.
        newBoard[captureRow][move.to.col] = null;
    }

    // Promotion (AI assumes Queen for now)
    if (move.isPromotion) {
        newBoard[move.to.row][move.to.col].type = 'q';
    }

    return newBoard;
};
