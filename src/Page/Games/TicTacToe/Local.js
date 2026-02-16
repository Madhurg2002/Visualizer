
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, User, Cpu } from 'lucide-react';
import Board from './Board';
import { checkWinner, isDraw } from './utils';
import { getComputersMove } from './Minimax';
import Confetti from '../../../Components/Confetti';

const LocalTicTacToe = ({ mode, onBack }) => {
    const [squares, setSquares] = useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [winner, setWinner] = useState(null);
    const [winningLine, setWinningLine] = useState(null);

    const isAiMode = mode === 'ai';
    const isAiTurn = isAiMode && !xIsNext && !winner;

    const handleClick = (i) => {
        if (squares[i] || winner || isAiTurn) return;

        const nextSquares = squares.slice();
        nextSquares[i] = xIsNext ? 'X' : 'O';
        setSquares(nextSquares);
        setXIsNext(!xIsNext);
    };

    useEffect(() => {
        const result = checkWinner(squares);
        if (result) {
            setWinner(result.winner);
            setWinningLine(result.line);
        } else if (isDraw(squares)) {
            setWinner('Draw');
        }
    }, [squares]);

    useEffect(() => {
        if (isAiTurn) {
            const timer = setTimeout(() => {
                const bestMove = getComputersMove(squares, 'hard', 'O');
                
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
        <div className="w-full px-4 flex flex-col items-center justify-start relative overflow-hidden h-full">
            {/* Confetti on Win */}
            {winner && winner !== 'Draw' && <Confetti />}

            {/* HUD */}
            <div className="w-full flex justify-between items-center mb-8 bg-slate-800/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md max-w-lg z-10 shadow-xl">
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
                    title="Restart Game"
                >
                    <RefreshCw size={24} />
                </button>
            </div>

            <div className="relative max-w-lg w-full z-10 mb-8">
                <Board 
                    squares={squares} 
                    onClick={handleClick} 
                    winningLine={winningLine} 
                    disabled={!!winner || isAiTurn}
                />

                {/* Game Over Overlay */}
                <AnimatePresence>
                    {winner && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-slate-900/90 p-8 rounded-3xl shadow-2xl border border-white/10 text-center pointer-events-auto backdrop-blur-xl">
                                <h3 className="text-4xl font-black text-white mb-2">
                                    {winner === 'Draw' ? '🤝 Draw!' : `🎉 ${winner} Won!`}
                                </h3>
                                <p className="text-slate-400 mb-6 font-medium">
                                    {winner === 'O' && isAiMode ? "The AI outsmarted you!" : winner === 'X' && isAiMode ? "You beat the AI!" : "Game Over"}
                                </p>
                                <button
                                    onClick={resetGame}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-bold shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all w-full"
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
                <div className="flex gap-12 z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className={`p-4 rounded-2xl transition-all duration-300 ${xIsNext && !winner ? 'bg-blue-500/20 text-blue-400 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-110' : 'bg-slate-800/50 text-slate-600 border-transparent grayscale'}`} style={{borderWidth: xIsNext && !winner ? 2 : 1}}>
                            <User size={32} />
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${xIsNext && !winner ? 'text-blue-400' : 'text-slate-600'}`}>You (X)</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className={`p-4 rounded-2xl transition-all duration-300 ${!xIsNext && !winner ? 'bg-purple-500/20 text-purple-400 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] scale-110' : 'bg-slate-800/50 text-slate-600 border-transparent grayscale'}`} style={{borderWidth: !xIsNext && !winner ? 2 : 1}}>
                            <Cpu size={32} />
                        </div>
                         <span className={`text-xs font-bold uppercase tracking-wider ${!xIsNext && !winner ? 'text-purple-400' : 'text-slate-600'}`}>AI (O)</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocalTicTacToe;
