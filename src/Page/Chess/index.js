
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trophy, Users, Globe } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Board from './Board';
import { initialBoard, getValidMoves, checkGameState, getAlgebraicNotation } from './logic'; // Import notation helper

import { getBestMove, evaluateBoard } from './AI';
import Stockfish from './StockfishEngine';
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
    const [manualFlip, setManualFlip] = useState(false);

    // Analysis State
    const [evalScore, setEvalScore] = useState(0); // Centipawns (roughly)
    const [bestMoveHint, setBestMoveHint] = useState(null);

    // Timer State
    const [timeControl, setTimeControl] = useState({ min: 10, sec: 0 });
    const [whiteTime, setWhiteTime] = useState(10 * 60);
    const [blackTime, setBlackTime] = useState(10 * 60);
    const [timerActive, setTimerActive] = useState(false);

    // Derived State for Board Orientation
    const isFlipped = mode === 'local' ? turn === 'b' : manualFlip;

    // History & Analysis
    const [moveHistory, setMoveHistory] = useState([]);
    const [boardHistory, setBoardHistory] = useState([initialBoard]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [pgnInput, setPgnInput] = useState("");

    // Settings
    const [engineDepth, setEngineDepth] = useState(10); // Default Depth
    const [historyView, setHistoryView] = useState('table'); // 'table' or 'list'
    const [showPanel, setShowPanel] = useState(true); // Toggle right panel

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
        setManualFlip(false);
        setMoveHistory([]);
        setBoardHistory([initialBoard]);
        setCurrentMoveIndex(0);
        setPgnInput("");
        // Reset Timer
        // Reset Timer
        setWhiteTime(timeControl.min * 60 + timeControl.sec);
        setBlackTime(timeControl.min * 60 + timeControl.sec);
        setTimerActive(false);
        // AI Depth is persistent-ish but resets here if we want? Let's keep it.
    }, [mode]);

    // STOCKFISH ENGINE SETUP
    useEffect(() => {
        Stockfish.init();
        return () => Stockfish.quit();
    }, []);

    // Helper: Convert UCI (e2e4) to Move Object
    const uciToMove = (uci, currentBoard) => {
        if (!uci) return null;
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

        const fromCol = files.indexOf(uci[0]);
        const fromRow = ranks.indexOf(uci[1]);
        const toCol = files.indexOf(uci[2]);
        const toRow = ranks.indexOf(uci[3]);
        const promotion = uci[4]; // 'q', 'r', 'b', 'n'

        if (fromCol === -1 || fromRow === -1 || toCol === -1 || toRow === -1) return null;

        const legalMoves = getValidMoves(currentBoard, fromRow, fromCol, lastMove);
        const move = legalMoves.find(m => m.row === toRow && m.col === toCol && (!promotion || m.promotionType === promotion));

        // Fallback for promotion if stockfish gives 'e7e8q' but we only checked coords?
        // Actually legalMoves usually have 'isPromotion' flag but maybe not type attached yet?
        // getValidMoves returns { ... isPromotion: true }.
        // We should attach promotion type if UCI specifies it.
        if (move && promotion && move.isPromotion) {
            move.promotionType = promotion;
        } else if (move && move.isPromotion && !promotion) {
            move.promotionType = 'q'; // Default to Queen if SF omits (rare)
        }

        return { move, from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
    };

    // ANALYSIS ENGINE EFFECT
    useEffect(() => {
        if (mode === 'analysis') {
            // Hook up Stockfish callbacks
            Stockfish.onEvaluation = (score) => setEvalScore(score);
            Stockfish.onBestMove = (uci) => {
                const res = uciToMove(uci, board);
                if (res) setBestMoveHint(res);
            };

            // Debounce evaluation
            const timer = setTimeout(() => {
                // Depth 15 for analysis
                Stockfish.evaluate(board, turn, engineDepth, lastMove);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setEvalScore(0);
            setBestMoveHint(null);
        }
    }, [board, turn, mode, lastMove]);

    // AI MOVE EFFECT
    useEffect(() => {
        if (mode === 'ai' && turn === 'b' && (gameState === 'playing' || gameState === 'check')) {
            setIsThinking(true);

            // Use engineDepth directly
            const sfDepth = engineDepth;

            Stockfish.onBestMove = (uci) => {
                const res = uciToMove(uci, board);
                if (res && res.move) {
                    executeMove(res.from.row, res.from.col, res.to.row, res.to.col, res.move);
                }
                setIsThinking(false);
            };

            // Delay slightly for UI visual
            const timer = setTimeout(() => {
                Stockfish.evaluate(board, turn, sfDepth, lastMove);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [mode, turn, gameState, board, lastMove, engineDepth]);

    // TIMER LOGIC
    useEffect(() => {
        let interval = null;
        if (timerActive && (gameState === 'playing' || gameState === 'check')) {
            interval = setInterval(() => {
                if (turn === 'w') {
                    setWhiteTime(prev => {
                        if (prev <= 0) {
                            clearInterval(interval);
                            setGameState('timeout');
                            setTimerActive(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                } else {
                    setBlackTime(prev => {
                        if (prev <= 0) {
                            clearInterval(interval);
                            setGameState('timeout');
                            setTimerActive(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, gameState, turn]);

    // Format Time Helper
    const formatTime = (seconds) => {
        const m = Math.floor(Math.max(0, seconds) / 60);
        const s = Math.floor(Math.max(0, seconds) % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

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

        // Timer Control
        if (['checkmate', 'stalemate', 'timeout'].includes(newState)) {
            setTimerActive(false);
        } else {
            // Start timer if not already active (first move)
            if (!timerActive) setTimerActive(true);
        }

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
            let currentLastMove = null; // Track last move during simulation

            for (const pgnMove of pgnMoves) {
                // Find move object from algebraic string
                const moveObj = algebraicToMove(pgnMove, currentB, currentT, currentLastMove);
                if (!moveObj) {
                    console.error("Failed to parse move:", pgnMove, currentB, currentT);
                    break; // Stop parsing on error
                }

                const result = calculateMoveResult(currentB, currentT, moveObj);

                currentB = result.newBoard;
                currentT = result.nextTurn;
                currentLastMove = result.thisMove; // Update for next iteration checks (EP)
                historyB.push(currentB);
                historyM.push(result.notation);
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
        <div className="w-full flex flex-col items-center justify-start p-4 relative overflow-hidden">

            {/* Header / Nav */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-6 z-20">
                <button onClick={() => navigate('/Chess')} className="p-3 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white transition-all shadow-lg flex items-center gap-2">
                    <ArrowLeft size={20} />
                    <span className="hidden md:inline text-sm font-bold">Back</span>
                </button>

                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
                        {mode === 'local' ? 'Local PvP' : mode === 'ai' ? 'Vs Computer' : 'Analysis Board'}
                    </h2>

                    {/* AI Status / Game Status */}
                    <div className={`text-sm md:text-xl font-bold mt-1 ${gameState === 'checkmate' || gameState === 'timeout' ? 'text-red-500' :
                        gameState === 'check' ? 'text-orange-500' :
                            'text-slate-400'
                        }`}>
                        {gameState === 'checkmate' ? `Checkmate! ${turn === 'w' ? 'Black' : 'White'} Wins!` :
                            gameState === 'timeout' ? `Time Out! ${turn === 'w' ? 'Black' : 'White'} Wins!` :
                                gameState === 'check' ? `${turn === 'w' ? 'White' : 'Black'} is in Check!` :
                                    gameState === 'stalemate' ? "Stalemate!" :
                                        `Turn: ${turn === 'w' ? 'White' : 'Black'}`}
                    </div>

                    {/* Timers */}
                    {(mode === 'local' || mode === 'ai') && (
                        <div className="flex items-center justify-center gap-4 mt-2">
                            <div className={`px-3 py-1 rounded-lg border font-mono font-bold ${turn === 'w' ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-slate-800 text-slate-500 border-white/10'}`}>
                                ⚪ {formatTime(whiteTime)}
                            </div>
                            <div className={`px-3 py-1 rounded-lg border font-mono font-bold ${turn === 'b' ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-slate-800 text-slate-500 border-white/10'}`}>
                                ⚫ {formatTime(blackTime)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {/* Engine Depth Control */}
                    {(mode === 'ai' || mode === 'analysis') && (
                        <div className="flex items-center gap-2 mr-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="text-xs font-bold text-slate-400 uppercase">Depth</span>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={engineDepth}
                                onChange={(e) => setEngineDepth(parseInt(e.target.value))}
                                className="w-16 accent-purple-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-white w-4 text-center">{engineDepth}</span>
                        </div>
                    )}

                    {/* Time Control (Local/AI) */}
                    {(mode === 'local' || mode === 'ai') && (
                        <div className="flex items-center gap-1 mr-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="text-xs font-bold text-slate-400 uppercase mr-1">Time</span>

                            {/* Minutes Input */}
                            <div className="relative flex items-center">
                                <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={timeControl.min}
                                    onChange={(e) => {
                                        const newMin = Math.max(0, parseInt(e.target.value) || 0);
                                        setTimeControl(prev => ({ ...prev, min: newMin }));

                                        // Update actual game time immediately for "Setup" feel
                                        // Preserves existing seconds
                                        const totalSeconds = newMin * 60 + timeControl.sec;
                                        setWhiteTime(totalSeconds);
                                        setBlackTime(totalSeconds);
                                        setTimerActive(false);
                                    }}
                                    className="w-8 bg-transparent text-xs font-bold text-white text-center border-none outline-none focus:ring-0 p-0"
                                />
                                <span className="text-[10px] text-slate-500 font-bold">m</span>
                            </div>

                            <span className="text-slate-600">:</span>

                            {/* Seconds Input */}
                            <div className="relative flex items-center">
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={timeControl.sec}
                                    onChange={(e) => {
                                        const newSec = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                                        setTimeControl(prev => ({ ...prev, sec: newSec }));

                                        // Update actual game time immediately
                                        // Preserves existing minutes
                                        const totalSeconds = timeControl.min * 60 + newSec;
                                        setWhiteTime(totalSeconds);
                                        setBlackTime(totalSeconds);
                                        setTimerActive(false);
                                    }}
                                    className="w-8 bg-transparent text-xs font-bold text-white text-center border-none outline-none focus:ring-0 p-0"
                                />
                                <span className="text-[10px] text-slate-500 font-bold">s</span>
                            </div>
                        </div>
                    )}

                    {/* Only show flip button in Analysis mode */}
                    {(mode === 'analysis') && (
                        <button
                            onClick={() => setManualFlip(!manualFlip)}
                            className="p-3 bg-slate-800 rounded-full border border-white/10 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shadow-lg"
                            title="Flip Board"
                        >
                            <RefreshCw size={20} />
                        </button>
                    )}

                    {/* Toggle Panel Button */}
                    <button
                        onClick={() => setShowPanel(!showPanel)}
                        className={`p-3 rounded-full border transition-all shadow-lg ${showPanel
                            ? 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
                            : 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-900/50'
                            }`}
                        title={showPanel ? "Hide Panel" : "Show Panel"}
                    >
                        {showPanel ? <div className="w-5 h-5 flex items-center justify-center">▶</div> : <div className="w-5 h-5 flex items-center justify-center">◀</div>}
                    </button>
                </div>
            </div>

            {/* AI Thinking Indicator */}
            {isThinking && (
                <div className="mb-4 text-emerald-400 animate-pulse flex items-center justify-center gap-2 font-mono text-sm">
                    <Users size={16} /> AI Thinking (Depth {engineDepth})...
                </div>
            )}

            <div className={`flex flex-col lg:flex-row gap-8 justify-center items-start w-full max-w-6xl px-4 transition-all duration-500 ${showPanel ? '' : 'justify-center'}`}>
                <div className={`relative flex-shrink-0 transition-all duration-500 ${showPanel ? '' : 'mx-auto'}`}>
                    <Board
                        board={board}
                        onSquareClick={handleSquareClick}
                        selectedSquare={selectedSquare}
                        possibleMoves={possibleMoves}
                        rotation={isFlipped}
                        bestMoveHint={mode === 'analysis' ? bestMoveHint : null} // Pass hint
                    />

                    {/* Evaluation Bar (Absolute Positioned relative to Board Container) */}
                    {mode === 'analysis' && (
                        <div className="absolute top-0 -left-6 md:-left-8 w-4 h-[100%] bg-slate-700/50 rounded-full overflow-hidden border border-white/10 shadow-lg">
                            {/* Fill based on score. Cap at +/- 1000. 50% is 0. */}
                            {/* If score > 0 (White adv), bar fills from bottom up. But standard eval bar:
                                White adv -> White bar grows from bottom? Or Black bar shrinks?
                                Standard: Full bar. Top is Black, Bottom is White. 
                                White advantage -> White part (Bottom) grows.
                                Height% = 50 + (score / 20). Caps at 5/95.
                             */}
                            <div
                                className="absolute bottom-0 w-full bg-emerald-500 transition-all duration-500"
                                style={{
                                    height: `${Math.min(95, Math.max(5, 50 + (evalScore / 20)))}%`, // Scaling: 1000 score = 100%? No, 1000 score (10 pawns) is huge.
                                    // evaluateBoard returns ~100 per pawn. 
                                    // So +1000 is winning. +1000/20 = +50%. 50+50 = 100%. correct.
                                }}
                            />
                            {/* Score Text */}
                            <div className="absolute top-0 w-full text-[8px] text-center text-white/80 font-mono mt-1">
                                {evalScore > 0 ? `+${(evalScore / 100).toFixed(1)}` : (evalScore / 100).toFixed(1)}
                            </div>
                        </div>
                    )}
                </div>

                {/* HUD / History Panel */}
                <div className={`w-full lg:w-80 h-[400px] lg:h-[600px] flex flex-col gap-4 transition-all duration-500 ${showPanel ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 hidden'}`}>
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
        <div className="min-h-screen bg-[#0B0C15] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            </div>

            <div className="absolute top-4 left-4 md:left-8 z-30">
                <button
                    onClick={() => navigate('/')}
                    className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-slate-400 hover:text-white transition-all duration-300"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold">Main Menu</span>
                </button>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center mb-16 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 mb-6 drop-shadow-2xl tracking-tighter">
                        CHESS
                        <span className="text-emerald-500">.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
                        Master the timeless game of strategy. <br />
                        <span className="text-slate-500">Play locally, challenge our AI, or compete online.</span>
                    </p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4 z-20">
                {[
                    {
                        title: "Local PvP",
                        desc: "Pass & Play on one device",
                        icon: Users,
                        color: "emerald",
                        path: "/Chess/local"
                    },
                    {
                        title: "Vs Computer",
                        desc: "Challenge the Engine",
                        icon: Trophy,
                        color: "purple",
                        path: "/Chess/ai"
                    },
                    {
                        title: "Online Multiplayer",
                        desc: "Real-time Ranked Matches",
                        icon: Globe,
                        color: "blue",
                        path: "/Chess/online"
                    },
                    {
                        title: "Analysis Board",
                        desc: "Study games & PGNs",
                        icon: RefreshCw,
                        color: "orange",
                        path: "/Chess/analysis"
                    },
                ].map((item, idx) => (
                    <motion.button
                        key={idx}
                        onClick={() => navigate(item.path)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 + 0.3 }}
                        className={`
                            relative group p-8 rounded-3xl border border-white/5 
                            bg-gradient-to-b from-white/[0.03] to-transparent 
                            hover:from-white/[0.08] hover:to-white/[0.02] 
                            backdrop-blur-xl transition-all duration-500
                            hover:shadow-2xl hover:shadow-${item.color}-500/20 hover:-translate-y-2
                            text-left flex flex-col h-full overflow-hidden
                        `}
                    >
                        <div className={`
                            absolute top-0 right-0 p-32 bg-${item.color}-500/10 rounded-full blur-3xl 
                            transform translate-x-1/2 -translate-y-1/2 group-hover:bg-${item.color}-500/20 transition-all duration-500
                        `}></div>

                        <div className={`
                            w-14 h-14 rounded-2xl mb-6 flex items-center justify-center
                            bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-500/5 
                            border border-${item.color}-500/20 group-hover:scale-110 transition-transform duration-500
                        `}>
                            <item.icon className={`w-7 h-7 text-${item.color}-400`} />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                            {item.title}
                        </h3>
                        <p className="text-slate-500 group-hover:text-slate-400 transition-colors text-sm font-medium">
                            {item.desc}
                        </p>

                        <div className="mt-auto pt-8 flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-600 group-hover:text-white transition-colors">
                            <span>Start Game</span>
                            <ArrowLeft className="rotate-180 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.button>
                ))}
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
