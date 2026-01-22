
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, User, Cpu } from 'lucide-react';
import Board from './Board';
import { checkWinner, isDraw } from './utils';
import { getBestMove } from './Minimax';

const LocalTicTacToe = ({ mode, onBack }) => {
    const [squares, setSquares] = useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [winner, setWinner] = useState(null);
    const [winningLine, setWinningLine] = useState(null);

    const isAiMode = mode === 'ai';
    // If AI mode, Player is X, AI is O. X goes first.
    const isAiTurn = isAiMode && !xIsNext && !winner;

    const handleClick = (i) => {
        if (squares[i] || winner || isAiTurn) return;

        const nextSquares = squares.slice();
        nextSquares[i] = xIsNext ? 'X' : 'O';
        setSquares(nextSquares);
        setXIsNext(!xIsNext);
    };

    // Check for winner
    useEffect(() => {
        const result = checkWinner(squares);
        if (result) {
            setWinner(result.winner);
            setWinningLine(result.line);
        } else if (isDraw(squares)) {
            setWinner('Draw');
        }
    }, [squares]);

    // AI Move
    useEffect(() => {
        if (isAiTurn) {
            // Small delay for realism
            const timer = setTimeout(() => {
                const bestMove = getBestMove(squares, 'O');
                if (bestMove !== -1) {
                    setSquares((prev) => {
                        const next = prev.slice();
                        next[bestMove] = 'O';
                        return next;
                    });
                    setXIsNext(true);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isAiTurn, squares]);

    const resetGame = () => {
        setSquares(Array(9).fill(null));
        setXIsNext(true);
        setWinner(null);
        setWinningLine(null);
    };

    const status = winner
        ? winner === 'Draw'
            ? "It's a Draw!"
            : `Winner: ${winner}`
        : `Next Player: ${xIsNext ? 'X' : 'O'}`;

    return (
        <div className="min-h-screen bg-[#0B0C15] pt-36 md:pt-40 px-4 flex flex-col items-center justify-start relative overflow-hidden">
            {/* HUD */}
            <div className="w-full flex justify-between items-center mb-8 bg-slate-800/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md max-w-lg z-10">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                        {isAiMode ? 'Single Player' : 'Two Players'}
                    </div>
                    <motion.div
                        key={status}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`font-black text-2xl ${winner ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500' : 'text-white'}`}
                    >
                        {winner === 'Draw' ? "Draw!" : winner ? `${winner} Wins!` : (
                            <span className="flex items-center gap-2">
                                Turn: <span className={xIsNext ? "text-blue-400" : "text-purple-400"}>{xIsNext ? 'X' : 'O'}</span>
                            </span>
                        )}
                    </motion.div>
                </div>

                <button
                    onClick={resetGame}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                    <RefreshCw size={24} />
                </button>
            </div>

            <div className="relative max-w-lg w-full z-10">
                <Board squares={squares} onClick={handleClick} winningLine={winningLine} />

                {/* Game Over Overlay */}
                <AnimatePresence>
                    {winner && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-3xl"
                        >
                            <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-white/10 text-center">
                                <h3 className="text-3xl font-black text-white mb-4">
                                    {winner === 'Draw' ? '🤝 Draw!' : `🎉 ${winner} Won!`}
                                </h3>
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                >
                                    Play Again
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mode Indicator */}
            {isAiMode && (
                <div className="mt-8 flex gap-8 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className={`p-4 rounded-full ${xIsNext ? 'bg-blue-500/20 text-blue-400 border border-blue-500' : 'bg-slate-800 text-slate-500 border border-transparent'}`}>
                            <User size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400">You (X)</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`p-4 rounded-full ${!xIsNext ? 'bg-purple-500/20 text-purple-400 border border-purple-500' : 'bg-slate-800 text-slate-500 border border-transparent'}`}>
                            <Cpu size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400">AI (O)</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocalTicTacToe;
