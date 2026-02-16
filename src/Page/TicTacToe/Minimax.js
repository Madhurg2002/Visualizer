
import { checkWinner, isDraw } from './utils';

export const getBestMove = (squares, aiPlayer = 'O') => {
    // ... (Existing Minimax Logic kept as help function or inside here)
    // Actually, I should keep the minimax logic but wrap it.
    
    // Minimax implementation ...
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
                    board[i] = (aiPlayer === 'O' ? 'X' : 'O');
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
    
    // Optimization: If empty board, pick center
    const emptySpots = squares.filter((s) => s === null).length;
    if (emptySpots === 9) return 4;
    // If center is empty, take it (unless opponent took corner? Minimax handles it, but optimization helps speed)
    if (squares[4] === null) return 4;


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


export const getRandomMove = (squares) => {
    const available = squares.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (available.length === 0) return -1;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
};

export const getComputersMove = (squares, difficulty, aiPlayer = 'O') => {
    // Easy: 100% Random
    if (difficulty === 'easy') {
        const move = getRandomMove(squares);
        // Fallback if random fails (shouldn't happen)
        return move !== -1 ? move : getBestMove(squares, aiPlayer); 
    }
    
    // Medium: 30% Random, 70% Best
    if (difficulty === 'medium') {
        const isRandom = Math.random() < 0.3;
        if (isRandom) {
             const move = getRandomMove(squares);
             return move !== -1 ? move : getBestMove(squares, aiPlayer);
        }
        return getBestMove(squares, aiPlayer);
    }

    // Hard: 100% Best
    return getBestMove(squares, aiPlayer);
};
