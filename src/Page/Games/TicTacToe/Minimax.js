import { checkWinner, isDraw } from './utils';

const SCORES = {
    X: 100,
    O: -100,
    TIE: 0
};

const getAvailableMoves = (board) => {
    return board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
};

export function getBestMove(board, player, maxDepth = Infinity, history = [], variant = 'classic') {
    let bestScore = player === 'X' ? -Infinity : Infinity;
    let move = -1;

    // Optimization: If empty board, pick center
    const emptySpots = board.filter((s) => s === null).length;
    if (emptySpots === 9) return 4;
    // If center is empty, take it (unless opponent took corner? Minimax handles it, but optimization helps speed)
    if (board[4] === null) return 4;

    const minimax = (currentBoard, depth, isMaximizingPlayer, aiSymbol, currentHistory, currentMaxDepth, currentVariant) => {
        const winnerData = checkWinner(currentBoard);
        if (winnerData) {
            return SCORES[winnerData.winner];
        }
        if (isDraw(currentBoard)) {
            return SCORES.TIE;
        }

        if (depth >= currentMaxDepth) {
            return 0; // Heuristic evaluation for depth limit
        }

        const availableMoves = getAvailableMoves(currentBoard);
        if (availableMoves.length === 0) {
            return SCORES.TIE;
        }

        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            for (let i = 0; i < availableMoves.length; i++) {
                const index = availableMoves[i];
                currentBoard[index] = aiSymbol;

                let simulatedHistory = currentHistory ? currentHistory.slice() : [];
                let removedIndex = null;
                let removedPiece = null;

                if (currentVariant === 'disappearing' && simulatedHistory.length === 6) {
                    removedIndex = simulatedHistory.shift();
                    removedPiece = currentBoard[removedIndex];
                    currentBoard[removedIndex] = null;
                }

                simulatedHistory.push(index);

                let evaluation = minimax(currentBoard, depth + 1, false, aiSymbol, simulatedHistory, currentMaxDepth, currentVariant);
                maxEval = Math.max(maxEval, evaluation);

                currentBoard[index] = null; // Undo move
                if (currentVariant === 'disappearing' && removedIndex !== null) {
                    currentBoard[removedIndex] = removedPiece; // Restore removed piece
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            const opponentSymbol = aiSymbol === 'X' ? 'O' : 'X';
            for (let i = 0; i < availableMoves.length; i++) {
                const index = availableMoves[i];
                currentBoard[index] = opponentSymbol;

                let simulatedHistory = currentHistory ? currentHistory.slice() : [];
                let removedIndex = null;
                let removedPiece = null;

                if (currentVariant === 'disappearing' && simulatedHistory.length === 6) {
                    removedIndex = simulatedHistory.shift();
                    removedPiece = currentBoard[removedIndex];
                    currentBoard[removedIndex] = null;
                }

                simulatedHistory.push(index);

                let evaluation = minimax(currentBoard, depth + 1, true, aiSymbol, simulatedHistory, currentMaxDepth, currentVariant);
                minEval = Math.min(minEval, evaluation);

                currentBoard[index] = null; // Undo move
                if (currentVariant === 'disappearing' && removedIndex !== null) {
                    currentBoard[removedIndex] = removedPiece; // Restore removed piece
                }
            }
            return minEval;
        }
    };

    let availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) return -1;

    // Store moves with their scores to handle ties
    const movesWithScores = [];

    for (let i = 0; i < availableMoves.length; i++) {
        const index = availableMoves[i];
        board[index] = player;

        let simulatedHistory = history ? history.slice() : [];
        let removedIndex = null;
        let removedPiece = null;

        if (variant === 'disappearing' && simulatedHistory.length === 6) {
            removedIndex = simulatedHistory.shift();
            removedPiece = board[removedIndex];
            board[removedIndex] = null;
        }

        simulatedHistory.push(index);

        // We use depth=0 here, limiting to depth=5 to avoid excessive tree depth in infinite game
        const currentMaxDepth = variant === 'disappearing' ? 5 : maxDepth;
        let score = minimax(board, 0, false, player, simulatedHistory, currentMaxDepth, variant);

        board[index] = null; // Undo move
        if (variant === 'disappearing' && removedIndex !== null) {
            board[removedIndex] = removedPiece; // Restore removed piece
        }

        movesWithScores.push({ move: index, score: score });

        if (player === 'X') { // Maximizing player
            if (score > bestScore) {
                bestScore = score;
                move = index;
            }
        } else { // Minimizing player
            if (score < bestScore) {
                bestScore = score;
                move = index;
            }
        }
    }

    // If multiple moves have the same best score, pick one randomly
    const bestMoves = movesWithScores.filter(m => m.score === bestScore);
    if (bestMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * bestMoves.length);
        return bestMoves[randomIndex].move;
    }

    return move;
}

export function getComputersMove(board, difficulty, aiSymbol, history, variant = 'classic') {
    if (difficulty === 'easy') {
        const availableMoves = getAvailableMoves(board);
        if (availableMoves.length === 0) return -1;
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    } else if (difficulty === 'medium') {
        const isRandom = Math.random() < 0.3;
        if (isRandom) {
            const availableMoves = getAvailableMoves(board);
            if (availableMoves.length === 0) return -1;
            const randomIndex = Math.floor(Math.random() * availableMoves.length);
            return availableMoves[randomIndex];
        }
        return getBestMove(board, aiSymbol, Infinity, history, variant);
    }
    // Hard: 100% Best
    return getBestMove(board, aiSymbol, Infinity, history, variant);
}
