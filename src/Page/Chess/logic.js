
// Initial Board Setup
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

// Helper: Check if square is on board
export const isValidSquare = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

// Helper: Check if target square matches color
export const isSameColor = (piece, targetPiece) => piece && targetPiece && piece.color === targetPiece.color;
export const isOpponent = (piece, targetPiece) => piece && targetPiece && piece.color !== targetPiece.color;

// Get all possible moves for a piece (pseudo-legal, not checking for check yet)
export const getPossibleMoves = (board, row, col, lastMove) => {
    const piece = board[row][col];
    if (!piece) return [];

    const moves = [];
    const { type, color, hasMoved } = piece;
    const direction = color === 'w' ? -1 : 1; // White moves up (-1), Black moves down (+1)

    // Helper to add move if valid
    const tryAddMove = (r, c) => {
        if (isValidSquare(r, c)) {
            const target = board[r][c];
            if (!target) {
                moves.push({ row: r, col: c });
                return true; // Continue sliding
            } else if (isOpponent(piece, target)) {
                moves.push({ row: r, col: c, capture: true });
                return false; // Stop sliding (capture)
            } else {
                return false; // Stop sliding (blocked by own piece)
            }
        }
        return false; // Off board
    };

    // PAWN
    if (type === 'p') {
        const promotionRow = color === 'w' ? 0 : 7;

        // Forward 1
        if (isValidSquare(row + direction, col) && !board[row + direction][col]) {
            const isPromotion = row + direction === promotionRow;
            moves.push({ row: row + direction, col: col, isPromotion });

            // Forward 2 (Initial move)
            const startRow = color === 'w' ? 6 : 1;
            if (row === startRow && !board[row + direction * 2][col]) {
                moves.push({ row: row + direction * 2, col: col, isDoubleJump: true });
            }
        }
        // Captures
        [[row + direction, col - 1], [row + direction, col + 1]].forEach(([r, c]) => {
            if (isValidSquare(r, c)) {
                const target = board[r][c];
                if (target && isOpponent(piece, target)) {
                    const isPromotion = r === promotionRow;
                    moves.push({ row: r, col: c, capture: true, isPromotion });
                }
                // En Passant
                else if (lastMove && lastMove.piece.type === 'p' && lastMove.isDoubleJump &&
                    lastMove.to.row === row && lastMove.to.col === c) {
                    moves.push({ row: r, col: c, capture: true, isEnPassant: true });
                }
            }
        });
    }

    // ROOK (Sliding)
    if (type === 'r' || type === 'q') {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        directions.forEach(([dr, dc]) => {
            for (let i = 1; i < 8; i++) {
                if (!tryAddMove(row + dr * i, col + dc * i)) break;
            }
        });
    }

    // BISHOP (Sliding)
    if (type === 'b' || type === 'q') {
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        directions.forEach(([dr, dc]) => {
            for (let i = 1; i < 8; i++) {
                if (!tryAddMove(row + dr * i, col + dc * i)) break;
            }
        });
    }

    // KNIGHT
    if (type === 'n') {
        const jumps = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        jumps.forEach(([dr, dc]) => tryAddMove(row + dr, col + dc));
    }

    // KING
    if (type === 'k') {
        const steps = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        steps.forEach(([dr, dc]) => tryAddMove(row + dr, col + dc));
    }
    return moves;
};

// Helper: Find King position
export const findKing = (board, color) => {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.type === 'k' && piece.color === color) {
                return { row: r, col: c };
            }
        }
    }
    return null; // Should not happen
};

// Check if a square is under attack by opponent
export const isSquareAttacked = (board, row, col, opponentColor) => {
    // Check all opponent pieces to see if they can move to (row, col)
    // Optimization: We can reverse check (e.g. check knight jumps from square)

    // 1. Check Pawn Attacks
    const pawnDir = opponentColor === 'w' ? -1 : 1; // Opponent's forward
    // Opponent pawns are at (row - pawnDir, col +/- 1) attacking (row, col)
    // Actually, if we are at (row, col), we look for opponent pawns at (row - pawnDir)
    // Wait, if opponent is White (moves UP, -1), they are at row+1 attacking row.
    const attackRow = row - pawnDir; // The row where a pawn would be to attack 'row'
    if (isValidSquare(attackRow, col - 1)) {
        const p = board[attackRow][col - 1];
        if (p && p.color === opponentColor && p.type === 'p') return true;
    }
    if (isValidSquare(attackRow, col + 1)) {
        const p = board[attackRow][col + 1];
        if (p && p.color === opponentColor && p.type === 'p') return true;
    }

    // 2. Check Knight Attacks
    const knightJumps = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (let [dr, dc] of knightJumps) {
        if (isValidSquare(row + dr, col + dc)) {
            const p = board[row + dr][col + dc];
            if (p && p.color === opponentColor && p.type === 'n') return true;
        }
    }

    // 3. Check King Attacks (for adjacent kings)
    const kingSteps = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (let [dr, dc] of kingSteps) {
        if (isValidSquare(row + dr, col + dc)) {
            const p = board[row + dr][col + dc];
            if (p && p.color === opponentColor && p.type === 'k') return true;
        }
    }

    // 4. Sliding Pieces (Rook/Queen)
    const orthDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let [dr, dc] of orthDirs) {
        for (let i = 1; i < 8; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (!isValidSquare(r, c)) break;
            const p = board[r][c];
            if (p) {
                if (p.color === opponentColor && (p.type === 'r' || p.type === 'q')) return true;
                break; // Blocked
            }
        }
    }

    // 5. Diagonal Pieces (Bishop/Queen)
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (let [dr, dc] of diagDirs) {
        for (let i = 1; i < 8; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (!isValidSquare(r, c)) break;
            const p = board[r][c];
            if (p) {
                if (p.color === opponentColor && (p.type === 'b' || p.type === 'q')) return true;
                break; // Blocked
            }
        }
    }

    return false;
};

// Check if player is in check
export const isCheck = (board, color) => {
    const kingPos = findKing(board, color);
    if (!kingPos) return false; // Should check error
    const opponent = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(board, kingPos.row, kingPos.col, opponent);
};

// Get ONLY valid moves (those that don't leave king in check)
export const getValidMoves = (board, row, col, lastMove) => {
    const piece = board[row][col];
    if (!piece) return [];

    // Get pseudo-legal moves
    const candidateMoves = getPossibleMoves(board, row, col, lastMove); // Use the existing function

    // Filter moves
    return candidateMoves.filter(move => {
        // Simulate move
        const tempBoard = board.map(r => r.map(c => c ? { ...c } : null)); // Deep copy-ish

        // Handle Castling Simulation (King safety checked, but simulate just in case?)
        // Standard simulation:
        tempBoard[move.row][move.col] = tempBoard[row][col];
        tempBoard[row][col] = null;

        // Check if our king is under attack after move
        return !isCheck(tempBoard, piece.color);
    });
};

// Check Game Over
export const checkGameState = (board, turn, lastMove) => {
    // 1. Is in check?
    const inCheck = isCheck(board, turn);

    // 2. Are there any valid moves?
    let hasMoves = false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] && board[r][c].color === turn) {
                const moves = getValidMoves(board, r, c, lastMove);
                if (moves.length > 0) {
                    hasMoves = true;
                    break;
                }
            }
        }
        if (hasMoves) break;
    }

    if (!hasMoves) {
        if (inCheck) return 'checkmate';
        return 'stalemate';
    }
    return inCheck ? 'check' : 'playing';
};

// Convert move to Algebraic Notation (e.g., Nf3, exd5, O-O, e8=Q#)
export const getAlgebraicNotation = (move, board, isCheck, isCheckmate) => {
    const { from, to, piece, isCastling, isPromotion, promotionType, isCapture } = move;

    if (isCastling) {
        return to.col > from.col ? "O-O" : "O-O-O"; // Kingside vs Queenside
    }

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const fromFile = files[from.col];
    const toFile = files[to.col];
    const toRank = ranks[to.row];

    let notation = "";

    // Piece Type (Pawn is empty usually)
    if (piece.type.toLowerCase() !== 'p') {
        notation += piece.type.toUpperCase();
    }

    // Disambiguation (not fully implemented, assume unique for now or add basic file if pawn capture)
    // Basic file disambiguation for pawns
    if (piece.type.toLowerCase() === 'p' && isCapture) {
        notation += fromFile;
    }

    // For Knights/Rooks, we might need disambiguation (e.g. Nge2), skipping complex logic for MVP
    // Ideally we check if another piece of same type/color can move to 'to'

    // Capture
    if (isCapture) {
        notation += "x";
    }

    // Destination
    notation += toFile + toRank;

    // Promotion
    if (isPromotion) {
        notation += "=" + (promotionType || 'Q').toUpperCase();
    }

    // Check/Checkmate
    if (isCheckmate) {
        notation += "#";
    } else if (isCheck) {
        notation += "+";
    }

    return notation;
};
