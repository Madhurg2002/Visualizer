
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trophy, Users, Globe } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Board from './Board';
import { initialBoard, getValidMoves, checkGameState, getAlgebraicNotation } from './logic'; // Import notation helper
import { getBestMove } from './AI';
import ChessOnline from './Online';
import MoveHistory from './MoveHistory'; // Import Component
import { parsePGN, algebraicToMove } from './pgnUtils';

const ChessGame = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Extract mode from URL path: /Chess/local, /Chess/ai, /Chess/online, /Chess/analysis
    const pathParts = location.pathname.split('/');
    const mode = pathParts[pathParts.length - 1].toLowerCase();
    // If just /Chess, mode might be empty or 'chess'. map to menu.
    const isMenu = mode === 'chess' || mode === '';

    // State
    const [board, setBoard] = useState(initialBoard);
    const [lastMove, setLastMove] = useState(null);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [turn, setTurn] = useState('w');
    const [gameState, setGameState] = useState('playing');
    const [isThinking, setIsThinking] = useState(false);
    const [promotionSquare, setPromotionSquare] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);

    // History & Analysis
    const [moveHistory, setMoveHistory] = useState([]);
    const [boardHistory, setBoardHistory] = useState([initialBoard]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [pgnInput, setPgnInput] = useState("");

    // Settings
    const [aiDepth, setAiDepth] = useState(3); // Default Medium
    const [historyView, setHistoryView] = useState('table'); // 'table' or 'list'

    // Reset Game on Mode Change
    useEffect(() => {
        setBoard(initialBoard);
        setLastMove(null);
        setSelectedSquare(null);
        setPossibleMoves([]);
        setTurn('w');
        setGameState('playing');
        setIsThinking(false);
        setPromotionSquare(null);
        setIsFlipped(false);
        setMoveHistory([]);
        setBoardHistory([initialBoard]);
        setCurrentMoveIndex(0);
        setPgnInput("");
        // AI Depth is persistent-ish but resets here if we want? Let's keep it.
    }, [mode]);

    // AI MOVE EFFECT
    useEffect(() => {
        if (mode === 'ai' && turn === 'b' && (gameState === 'playing' || gameState === 'check')) {
            setIsThinking(true);
            const timer = setTimeout(() => { // Minimax is synchronous, timeout for UI
                // Should run in worker ideally, but here simple timeout
                // Use selected depth
                const { move } = getBestMove(board, aiDepth, false, lastMove);
                if (move) {
                    if (move.isPromotion) move.promotionType = 'q';
                    executeMove(move.from.row, move.from.col, move.to.row, move.to.col, move);
                }
                setIsThinking(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [mode, turn, gameState, board, lastMove, aiDepth]);

    // Core Logic: Apply move to a board and return result (Pure Function roughly)
    const calculateMoveResult = (currentBoard, currentTurn, moveDetails) => {
        const { from, to, isEnPassant, isCastling, isPromotion, promotionType, isDoubleJump } = moveDetails;
        const fromRow = from.row;
        const fromCol = from.col;
        const toRow = to.row;
        const toCol = to.col;

        // Detect Capture
        const targetSquare = currentBoard[toRow][toCol];
        const isCapture = !!targetSquare || isEnPassant;

        const newBoard = currentBoard.map(r => r.map(c => c ? { ...c } : null));
        let movingPiece = { ...newBoard[fromRow][fromCol], hasMoved: true };

        // Handle Promotion
        if (isPromotion) {
            movingPiece.type = promotionType || 'q';
        }

        newBoard[fromRow][fromCol] = null;
        newBoard[toRow][toCol] = movingPiece;

        // Castling
        if (isCastling) {
            if (toCol > fromCol) { // Kingside
                const rook = newBoard[fromRow][7];
                newBoard[fromRow][7] = null;
                newBoard[fromRow][5] = { ...rook, hasMoved: true };
            } else { // Queenside
                const rook = newBoard[fromRow][0];
                newBoard[fromRow][0] = null;
                newBoard[fromRow][3] = { ...rook, hasMoved: true };
            }
        }

        // En Passant
        if (isEnPassant) {
            const captureRow = fromRow;
            newBoard[captureRow][toCol] = null;
        }

        const thisMove = {
            piece: movingPiece,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            isDoubleJump,
            isCapture,
            isCastling,
            isPromotion,
            promotionType
        };

        const nextTurn = currentTurn === 'w' ? 'b' : 'w';
        const state = checkGameState(newBoard, nextTurn, thisMove);
        const isCheck = state === 'check';
        const isCheckmate = state === 'checkmate';
        const notation = getAlgebraicNotation(thisMove, currentBoard, isCheck, isCheckmate);

        return { newBoard, nextTurn, newState: state, notation, thisMove };
    };

    const executeMove = (fromRow, fromCol, toRow, toCol, moveDetails) => {
        // Only allow moves if we are at the latest history state?
        // Or if we move from past, we rewrite history?
        // For simplicity: If moving, strict append. If viewing past, maybe block?
        // Let's assume we always move from 'board' state.

        const { newBoard, nextTurn, newState, notation, thisMove } = calculateMoveResult(board, turn, {
            ...moveDetails,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol }
        });

        // Update State
        setBoard(newBoard);
        setTurn(nextTurn);
        setLastMove(thisMove);
        setGameState(newState);

        // History Update
        const newHistory = moveHistory.slice(0, currentMoveIndex);
        newHistory.push(notation);
        setMoveHistory(newHistory);

        const newBoardHistory = boardHistory.slice(0, currentMoveIndex + 1);
        newBoardHistory.push(newBoard);
        setBoardHistory(newBoardHistory);
        setCurrentMoveIndex(newHistory.length);

        if (selectedSquare) {
            setSelectedSquare(null);
            setPossibleMoves([]);
            setPromotionSquare(null);
        }
    };

    const handleImportPGN = () => {
        if (!pgnInput) return;
        const pgnMoves = parsePGN(pgnInput);
        if (pgnMoves.length === 0) return alert("No valid moves found!");

        let currentB = initialBoard;
        let currentT = 'w';
        let historyB = [initialBoard];
        let historyM = [];

        try {
            for (const pgnMove of pgnMoves) {
                // Find move object from algebraic string
                // We need to pass the board and turn to `algebraicToMove`
                const moveObj = algebraicToMove(pgnMove, currentB, currentT);
                if (!moveObj) {
                    console.error("Failed to parse move:", pgnMove, currentB, currentT);
                    break; // Stop parsing on error
                }

                const result = calculateMoveResult(currentB, currentT, moveObj);

                currentB = result.newBoard;
                currentT = result.nextTurn;
                historyB.push(currentB);
                historyM.push(result.notation); // Use our generated notation or the PGN one? Ours is consistent.
            }

            setBoard(currentB);
            setTurn(currentT);
            setBoardHistory(historyB);
            setMoveHistory(historyM);
            setCurrentMoveIndex(historyM.length);
            setGameState('playing'); // Or calculate actual end state
            setLastMove(null); // Reset last move indicator?
            alert(`Imported ${historyM.length} moves successfully!`);

        } catch (e) {
            alert("Error importing PGN: " + e.message);
        }
    };

    const handleJumpToMove = (index) => {
        if (index < 0 || index >= boardHistory.length) return;
        setBoard(boardHistory[index]);
        setCurrentMoveIndex(index);

        // Determine turn based on index (even = white, odd = black)?
        // Index 0 = Start (White to move). Index 1 = After White move (Black to move).
        setTurn(index % 2 === 0 ? 'w' : 'b');

        // TODO: Update lastMove for highlighting based on the move at index-1?
    };

    const handleSquareClick = (row, col) => {
        // If viewing history (not latest), block interaction?
        if (currentMoveIndex !== moveHistory.length && mode !== 'analysis') {
            // In Analysis mode, maybe we allow branching? For now, block.
            return;
        }

        if (gameState !== 'playing' && gameState !== 'check' && mode !== 'analysis') return;

        // Block interaction if it's AI's turn
        if (mode === 'ai' && turn === 'b') return;
        // In Analysis mode, let user play both sides? Sure.

        if (promotionSquare) return;

        const clickedPiece = board[row][col];
        const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;

        if (isSelected) {
            setSelectedSquare(null);
            setPossibleMoves([]);
            return;
        }

        if (selectedSquare) {
            const move = possibleMoves.find(m => m.row === row && m.col === col);
            if (move) {
                if (move.isPromotion) {
                    setPromotionSquare({ row, col, move, fromRow: selectedSquare.row, fromCol: selectedSquare.col });
                    return;
                }
                executeMove(selectedSquare.row, selectedSquare.col, row, col, move);
                return;
            }
        }

        // Allow picking opponent pieces in analysis mode? No, still needs to be correct turn.
        if (clickedPiece && clickedPiece.color === turn) {
            setSelectedSquare({ row, col });
            const moves = getValidMoves(board, row, col, lastMove);
            setPossibleMoves(moves);
        } else {
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

    // RENDER
    return (
        <div className="min-h-screen bg-[#0B0C15] pt-36 md:pt-40 flex flex-col items-center justify-start p-4 relative overflow-hidden">
            <div className="absolute top-24 left-4 md:left-8 z-20">
                <button onClick={() => navigate('/Chess')} className="p-3 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white transition-all shadow-lg">
                    <ArrowLeft size={20} />
                </button>
            </div>

            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wide">
                    {mode === 'local' ? 'Local PvP' : mode === 'ai' ? 'Vs Computer' : 'Analysis Board'}
                </h2>

                {/* AI Difficulty Selector */}
                {mode === 'ai' && (
                    <div className="flex justify-center gap-2 mb-2">
                        {[1, 3, 5].map(depth => (
                            <button
                                key={depth}
                                onClick={() => setAiDepth(depth)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${aiDepth === depth
                                        ? 'bg-purple-600 text-white border-purple-500'
                                        : 'bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700'
                                    }`}
                            >
                                {depth === 1 ? 'Ez' : depth === 3 ? 'Mid' : 'Hard'}
                            </button>
                        ))}
                    </div>
                )}

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
                        <Users size={16} /> AI Thinking (Depth {aiDepth})...
                    </div>
                )}
            </div>

            {/* Flip Button */}
            {(mode === 'local' || mode === 'analysis') && (
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

            <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-6xl px-4">
                <div className="relative flex-shrink-0">
                    <Board
                        board={board}
                        onSquareClick={handleSquareClick}
                        selectedSquare={selectedSquare}
                        possibleMoves={possibleMoves}
                        rotation={isFlipped}
                    />
                </div>

                {/* HUD / History Panel */}
                <div className="w-full lg:w-80 h-[400px] lg:h-[600px] flex flex-col gap-4">
                    <div className="bg-slate-800 border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${turn === 'w' ? 'bg-white' : 'bg-black border border-white/20'}`}></div>
                            <span className="text-white font-bold">{turn === 'w' ? "White" : "Black"}</span>
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-slate-900 rounded-lg p-1 border border-white/5">
                            <button
                                onClick={() => setHistoryView('table')}
                                className={`p-1.5 rounded-md transition-all ${historyView === 'table' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                title="Table View"
                            >
                                <Users size={14} /> {/* Placeholder icon for table */}
                            </button>
                            <button
                                onClick={() => setHistoryView('list')}
                                className={`p-1.5 rounded-md transition-all ${historyView === 'list' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                title="List View"
                            >
                                <Globe size={14} /> {/* Placeholder icon for list */}
                            </button>
                        </div>
                    </div>

                    {mode === 'analysis' && (
                        <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
                            <textarea
                                value={pgnInput}
                                onChange={(e) => setPgnInput(e.target.value)}
                                placeholder="Paste PGN here..."
                                className="w-full h-20 bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white mb-2"
                            />
                            <button
                                onClick={handleImportPGN}
                                className="w-full py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold text-sm transition-colors"
                            >
                                Import Game
                            </button>
                        </div>
                    )}

                    <MoveHistory moves={moveHistory} viewMode={historyView} />
                </div>
            </div>

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

const ChessMenu = () => {
    const navigate = useNavigate();
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl px-4">
                <button onClick={() => navigate('/Chess/local')} className="p-8 bg-slate-900/40 border border-white/10 rounded-3xl hover:bg-slate-800/60 transition-all group">
                    <Users className="w-12 h-12 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400">Local PvP</h3>
                    <p className="text-slate-400">Play against a friend on this device.</p>
                </button>
                <button
                    onClick={() => navigate('/Chess/ai')}
                    className="p-8 bg-slate-900/40 border border-white/10 rounded-3xl hover:bg-slate-800/60 transition-all group"
                >
                    <Trophy className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400">Vs Computer</h3>
                    <p className="text-slate-400 text-sm">Challenge the AI</p>
                </button>
                <button
                    onClick={() => navigate('/Chess/online')}
                    className="p-8 bg-slate-900/40 border border-white/10 rounded-3xl hover:bg-slate-800/60 transition-all group"
                >
                    <Globe className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400">Play Online</h3>
                    <p className="text-slate-400 text-sm">Play with a friend remotely</p>
                </button>
                <button
                    onClick={() => navigate('/Chess/analysis')}
                    className="p-8 bg-slate-900/40 border border-white/10 rounded-3xl hover:bg-slate-800/60 transition-all group"
                >
                    <RefreshCw className="w-12 h-12 text-orange-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400">Analysis</h3>
                    <p className="text-slate-400 text-sm">Import PGN & Replay</p>
                </button>
            </div>
        </div>
    );
};

const ChessRoutes = () => {
    const navigate = useNavigate();
    return (
        <Routes>
            <Route index element={<ChessMenu />} />
            <Route path="local" element={<ChessGame />} />
            <Route path="ai" element={<ChessGame />} />
            <Route path="analysis" element={<ChessGame />} />
            <Route path="online" element={<ChessOnline onBack={() => navigate('/Chess')} />} />
        </Routes>
    );
}

export default ChessRoutes;
