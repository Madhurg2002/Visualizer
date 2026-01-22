
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trophy, Users, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Board from './Board';
import { initialBoard, getValidMoves, checkGameState } from './logic';
import { getBestMove } from './AI';
import ChessOnline from './Online';

const Chess = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('menu'); // 'menu', 'ai', 'local', 'online'
    const [board, setBoard] = useState(initialBoard);
    const [lastMove, setLastMove] = useState(null); // { piece, from: {r,c}, to: {r,c}, isDoubleJump }
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [turn, setTurn] = useState('w');
    const [gameState, setGameState] = useState('playing'); // playing, check, checkmate, stalemate
    const [isThinking, setIsThinking] = useState(false);
    const [promotionSquare, setPromotionSquare] = useState(null); // { row, col, move, fromRow, fromCol }
    const [isFlipped, setIsFlipped] = useState(false);

    // AI MOVE EFFECT
    useEffect(() => {
        if (mode === 'ai' && turn === 'b' && (gameState === 'playing' || gameState === 'check')) {
            setIsThinking(true);
            const timer = setTimeout(() => {
                const { move } = getBestMove(board, 3, false, lastMove); // Depth 3, minimizing (Black)
                if (move) {
                    // AI Promotion: Always Queen
                    if (move.isPromotion) {
                        move.promotionType = 'q';
                    }
                    executeMove(move.from.row, move.from.col, move.to.row, move.to.col, move);
                }
                setIsThinking(false);
            }, 500); // Delay for realism
            return () => clearTimeout(timer);
        }
    }, [mode, turn, gameState, board, lastMove]);

    // Refactored helper to execute moves (shared by Human and AI)
    const executeMove = (fromRow, fromCol, toRow, toCol, moveDetails) => {
        const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
        let movingPiece = { ...newBoard[fromRow][fromCol], hasMoved: true };

        // Handle Promotion
        if (moveDetails.isPromotion) {
            movingPiece.type = moveDetails.promotionType || 'q'; // Default to Queen if not specified
        }

        newBoard[fromRow][fromCol] = null;
        newBoard[toRow][toCol] = movingPiece;

        // Handle Castling
        if (moveDetails.isCastling) {
            // Logic must match AI/logic checks.
            // King Side: King from e(4) to g(6). Rook h(7) to f(5).
            if (toCol > fromCol) { // Kingside
                const rook = newBoard[fromRow][7];
                newBoard[fromRow][7] = null;
                newBoard[fromRow][5] = { ...rook, hasMoved: true };
            } else { // Queenside: King from e(4) to c(2). Rook a(0) to d(3).
                const rook = newBoard[fromRow][0];
                newBoard[fromRow][0] = null;
                newBoard[fromRow][3] = { ...rook, hasMoved: true };
            }
        }

        // Handle En Passant
        if (moveDetails.isEnPassant) {
            const captureRow = fromRow; // Captured pawn is on the same rank as start position
            newBoard[captureRow][toCol] = null;
        }

        const thisMove = {
            piece: movingPiece,
            from: { row: fromRow, col: fromCol },
            to: { row: toCol, col: toCol },
            isDoubleJump: moveDetails.isDoubleJump
        };
        setLastMove(thisMove);

        const nextTurn = turn === 'w' ? 'b' : 'w';
        setBoard(newBoard);
        setTurn(nextTurn);
        if (selectedSquare) { // Only clear if human... actually clearing always is fine
            setSelectedSquare(null);
            setPossibleMoves([]);
            setPromotionSquare(null);
        }

        const state = checkGameState(newBoard, nextTurn, thisMove);
        setGameState(state);
    };

    const handleSquareClick = (row, col) => {
        if (gameState !== 'playing' && gameState !== 'check') return;

        // Block interaction if it's AI's turn
        if (mode === 'ai' && turn === 'b') return;

        // If promotion is pending, block other clicks until resolved (or cancel?)
        if (promotionSquare) return;

        const clickedPiece = board[row][col];
        const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;

        // If clicking the same square, deselect
        if (isSelected) {
            setSelectedSquare(null);
            setPossibleMoves([]);
            return;
        }

        // If a piece is already selected, check if we can move to the clicked square
        if (selectedSquare) {
            const move = possibleMoves.find(m => m.row === row && m.col === col);
            if (move) {
                // Check Promotion
                if (move.isPromotion) {
                    setPromotionSquare({ row, col, move, fromRow: selectedSquare.row, fromCol: selectedSquare.col });
                    return;
                }

                executeMove(selectedSquare.row, selectedSquare.col, row, col, move);
                return;
            }
        }

        // Select a piece (only if it's current turn's color)
        if (clickedPiece && clickedPiece.color === turn) {
            setSelectedSquare({ row, col });
            const moves = getValidMoves(board, row, col, lastMove);
            setPossibleMoves(moves);
        } else {
            // Clicked empty square or enemy piece without valid move
            setSelectedSquare(null);
            setPossibleMoves([]);
        }
    };

    const handlePromotionSelect = (type) => {
        if (promotionSquare) {
            const { fromRow, fromCol, row, col, move } = promotionSquare;
            move.promotionType = type;
            executeMove(fromRow, fromCol, row, col, move);
            setSelectedSquare(null);
            setPossibleMoves([]);
            setPromotionSquare(null);
        }
    };

    if (mode === 'online') {
        return <ChessOnline onBack={() => setMode('menu')} />;
    }

    if (mode === 'menu') {
        return (
            <div className="min-h-screen bg-[#0B0C15] pt-36 md:pt-40 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-24 left-4 md:left-8 z-20">
                    <button onClick={() => navigate('/')} className="p-3 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white transition-all shadow-lg">
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">Chess</h1>
                    <p className="text-slate-400">Classic Strategy Game</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
                    <button onClick={() => setMode('local')} className="p-8 bg-slate-900/40 border border-white/10 rounded-3xl hover:bg-slate-800/60 transition-all group">
                        <Users className="w-12 h-12 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400">Local PvP</h3>
                        <p className="text-slate-400">Play against a friend on this device.</p>
                    </button>
                    <button
                        onClick={() => setMode('ai')}
                        className="w-full p-6 bg-slate-800 hover:bg-slate-700/80 rounded-2xl border border-white/10 flex items-center gap-4 transition-all group"
                    >
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-white mb-1">Vs Computer</h3>
                            <p className="text-slate-400 text-sm">Challenge the AI</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setMode('online')}
                        className="w-full p-6 bg-slate-800 hover:bg-slate-700/80 rounded-2xl border border-white/10 flex items-center gap-4 transition-all group"
                    >
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <Globe size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-white mb-1">Play Online</h3>
                            <p className="text-slate-400 text-sm">Play with a friend remotely</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0C15] pt-36 md:pt-40 flex flex-col items-center justify-start p-4 relative overflow-hidden">
            <div className="absolute top-24 left-4 md:left-8 z-20">
                <button onClick={() => setMode('menu')} className="p-3 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white transition-all shadow-lg">
                    <ArrowLeft size={20} />
                </button>
            </div>

            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Chess</h2>
                <div className={`text-xl font-bold ${gameState === 'checkmate' ? 'text-red-500' :
                    gameState === 'check' ? 'text-orange-500' :
                        'text-slate-400'
                    }`}>
                    {gameState === 'checkmate' ? `Checkmate! ${turn === 'w' ? 'Black' : 'White'} Wins!` :
                        gameState === 'check' ? `${turn === 'w' ? 'White' : 'Black'} is in Check!` :
                            gameState === 'stalemate' ? "Stalemate!" :
                                `Turn: ${turn === 'w' ? 'White' : 'Black'}`}
                </div>
                {isThinking && (
                    <div className="mt-2 text-emerald-400 animate-pulse flex items-center justify-center gap-2">
                        <Users size={16} /> AI is thinking...
                    </div>
                )}
            </div>

            {/* HUD / Controls */}
            {mode === 'local' && (
                <div className="absolute top-24 right-4 z-10">
                    <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="p-3 bg-slate-800 rounded-full border border-white/10 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shadow-lg"
                        title="Flip Board"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            )}

            <Board
                board={board}
                onSquareClick={handleSquareClick}
                selectedSquare={selectedSquare}
                possibleMoves={possibleMoves}
                rotation={mode === 'online' ? false : isFlipped} // Online has its own component with rotation. Here is Local/AI.
            />
            {/* Promotion Modal */}
            {promotionSquare && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-white mb-4 text-center">Promote Pawn</h3>
                        <div className="flex gap-4">
                            {['q', 'r', 'b', 'n'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => handlePromotionSelect(type)}
                                    className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-white/5 hover:border-emerald-400/50 group"
                                >
                                    {/* Minimalist representation or reuse components if possible. Using text for now or simple mapping */}
                                    <div className="text-3xl">
                                        {type === 'q' ? '♕' : type === 'r' ? '♖' : type === 'b' ? '♗' : '♘'}
                                    </div>
                                    <span className="text-xs text-slate-400 mt-1 block uppercase font-bold group-hover:text-emerald-400">
                                        {type === 'q' ? 'Queen' : type === 'r' ? 'Rook' : type === 'b' ? 'Bishop' : 'Knight'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chess;
