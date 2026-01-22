
import { checkWinner, isDraw } from './utils';

export const getBestMove = (squares, aiPlayer = 'O') => {
    const opponent = aiPlayer === 'O' ? 'X' : 'O';

    // Minimax algorithm
    const minimax = (board, depth, isMaximizing) => {
        const winnerData = checkWinner(board);
        if (winnerData) {
            return winnerData.winner === aiPlayer ? 10 - depth : depth - 10;
        }
        if (isDraw(board)) {
            return 0;
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (!board[i]) {
                    board[i] = aiPlayer;
                    const score = minimax(board, depth + 1, false);
                    board[i] = null;
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (!board[i]) {
                    board[i] = opponent;
                    const score = minimax(board, depth + 1, true);
                    board[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    };

    let bestScore = -Infinity;
    let move = -1;

    // First move optimization: Center or Corner
    const emptySpots = squares.filter((s) => s === null).length;
    if (emptySpots === 9) return 4; // Center
    if (emptySpots === 8 && squares[4] === null) return 4; // Center if empty

    for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
            squares[i] = aiPlayer;
            const score = minimax(squares, 0, false);
            squares[i] = null;
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
};
