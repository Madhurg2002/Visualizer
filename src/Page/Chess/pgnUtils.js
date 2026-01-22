import { getValidMoves, getPieceType, getPieceColor } from './logic';

// Basic PGN Parse (returns array of strings like ["e4", "e5", "Nf3"])
export const parsePGN = (pgn) => {
    // Remove comments { ... }
    let clean = pgn.replace(/\{[^}]*\}/g, "");
    // Remove move numbers 1. 2. ...
    // Remove move numbers 1. 2. ...
    clean = clean.replace(/\d+\.+/g, ""); // Handle 1. or 1...
    // Remove results 1-0, 0-1, 1/2-1/2
    clean = clean.replace(/(1-0|0-1|1\/2-1\/2)/g, "");
    // Remove extra whitespace including newlines
    const moves = clean.trim().split(/\s+/).filter(m => m && !/^\d+\.?$/.test(m)); // Filter out stray numbers
    return moves;
};

// Convert Algebraic (e.g. "Nf3") to Move Object { from: {r,c}, to: {r,c}, ... }
// Requires current board state and turn color to validate and find the piece.
// Convert Algebraic (e.g. "Nf3") to Move Object { from: {r,c}, to: {r,c}, ... }
// Requires current board state, turn color, and lastMove (for En Passant) to validate.
export const algebraicToMove = (notation, board, turn, lastMove) => {
    // 1. Parse Notation
    // Examples: "e4" (Pawn), "exd5", "Nf3", "Nbd7", "O-O", "O-O-O", "Qxd4+"

    // Clean check/mate symbols
    const cleanNotation = notation.replace(/[+#]/g, "");

    // Castling
    if (cleanNotation === "O-O") {
        const row = turn === 'w' ? 7 : 0; // Logic.js uses 7 for white (bottom), 0 for black (top) ? 
        // Wait, standard board: 0 is Black (Top), 7 is White (Bottom).
        // King is at e1/e8 (Col 4).
        // Kingside: King 4 -> 6 (g). Rook 7 -> 5 (f).
        return { isCastling: true, from: { row, col: 4 }, to: { row, col: 6 } };
    }
    if (cleanNotation === "O-O-O") {
        const row = turn === 'w' ? 7 : 0;
        // Queenside: King 4 -> 2 (c). Rook 0 -> 3 (d).
        return { isCastling: true, from: { row, col: 4 }, to: { row, col: 2 } };
    }

    // Promotion? e8=Q
    let promotionType = null;
    let mainPart = cleanNotation;
    if (cleanNotation.includes("=")) {
        const parts = cleanNotation.split("=");
        mainPart = parts[0];
        promotionType = parts[1].toLowerCase();
    }

    // Capture? exd5
    // Note: 'x' is decorative for finding the move, but implied by logic.
    // However, x is useful for splitting? standard regex is better.

    // Regex for standard moves:
    // ^([NBRQK])?([a-h])?([1-8])?(x)?([a-h][1-8])$ 
    // Captures group: 1:Piece, 2:FromFile, 3:FromRank, 4:Capture, 5:Dest

    // But logic simplifies:
    // Determine Target Square (last 2 chars usually, unless promotion removed above)
    const targetStr = mainPart.slice(-2);
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']; // logic.js rows 0-7 map to 8-1?
    // Review logic.js mapping:
    // files[0] = 'a', ranks[0] = '8'. 
    // logic.js: row 0 is rank 8. row 7 is rank 1.

    const toCol = files.indexOf(targetStr[0]);
    const toRow = ranks.indexOf(targetStr[1]);

    if (toCol === -1 || toRow === -1) return null; // Invalid

    // Determine Piece Type
    let pieceType = 'p'; // Default Pawn
    const firstChar = mainPart[0];
    if (['N', 'B', 'R', 'Q', 'K'].includes(firstChar)) {
        pieceType = firstChar.toLowerCase();
    }

    // Disambiguation hints
    // If Pawn: "exd5" -> from file 'e'
    // If piece: "Nbd7" -> from file 'b', "N1f3" -> from rank '1' (row 7)
    let disambigFile = -1;
    let disambigRow = -1;

    // Remove PieceType and Dest from string to see what's left
    // "Nbd7" -> "N", "d7", left "b"
    // "exd5" -> "e", "d5", left "x" (ignore x)
    let remainder = mainPart.slice(0, -2); // Remove dest
    if (['N', 'B', 'R', 'Q', 'K'].includes(remainder[0])) {
        remainder = remainder.slice(1); // Remove piece char
    }
    remainder = remainder.replace('x', ''); // Remove capture char

    if (remainder.length > 0) {
        if (files.includes(remainder[0])) {
            disambigFile = files.indexOf(remainder[0]);
        }
        if (ranks.includes(remainder[0])) { // Could be 2nd char if file also present?
            // Handle "N1f3" -> remainder "1". 
            disambigRow = ranks.indexOf(remainder[0]);
        } else if (ranks.includes(remainder[1])) {
            // Handle "Nb1d7" -> remainder "b1"
            disambigRow = ranks.indexOf(remainder[1]);
        }
    }

    // Special Case: Pawn moves (e4) don't have 'P' prefix.
    // But captures like "exd5" have 'e'.
    // If pieceType is P, and first char is file, that is disambigFile.
    if (pieceType === 'p' && files.includes(mainPart[0])) {
        disambigFile = files.indexOf(mainPart[0]);
    }


    // Search Board for candidates
    const candidates = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === turn && p.type === pieceType) {
                // Check if Disambiguation matches
                if (disambigFile !== -1 && c !== disambigFile) continue;
                if (disambigRow !== -1 && r !== disambigRow) continue;

                // Check if this piece can move to target
                // Check if this piece can move to target
                const moves = getValidMoves(board, r, c, lastMove);
                // Issue: getValidMoves needs lastMove for En Passant.
                // WE NEED LAST MOVE passed into this function too.
                // Assuming basic moves for now, but En Passant verification requires it.
                // For now, let's just use getValidMoves and hope EP isn't critical or pass a dummy if needed.
                // Actually, logic.js getPossibleMoves logic for EP:
                // if (lastMove && lastMove.piece.type === 'p'...)

                const valid = moves.find(m => m.row === toRow && m.col === toCol);
                if (valid) {
                    candidates.push({
                        from: { row: r, col: c },
                        to: { row: toRow, col: toCol },
                        isPromotion: valid.isPromotion, // logic.js returns this flag
                        isEnPassant: valid.isEnPassant,
                        isDoubleJump: valid.isDoubleJump,
                        // Add promotion type if specified
                        promotionType: promotionType
                    });
                }
            }
        }
    }

    if (candidates.length === 1) {
        return candidates[0];
    } else if (candidates.length > 1) {
        console.warn("Ambiguous move in PGN:", notation, candidates);
        return candidates[0]; // Best guess
    }

    return null;
};
