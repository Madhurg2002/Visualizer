
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ArrowLeft, Copy, Check, Users, Wifi } from 'lucide-react';
import Board from './Board';
import { getValidMoves, checkGameState, initialBoard } from './logic';
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';


const socket = io(SERVER_URL);



const ChessOnline = ({ onBack }) => {
    const [view, setView] = useState('menu'); // menu, lobby, game
    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [myColor, setMyColor] = useState(null); // 'w' or 'b'

    // Time Control State
    const [timeControl, setTimeControl] = useState(10); // Minutes (default 10)
    const [whiteTime, setWhiteTime] = useState(null); // Seconds
    const [blackTime, setBlackTime] = useState(null); // Seconds
    const [timerActive, setTimerActive] = useState(false);

    // Game State
    const [board, setBoard] = useState(initialBoard);
    const [turn, setTurn] = useState('w');
    const [gameState, setGameState] = useState('waiting'); // waiting, playing, check, checkmate, stalemate, timeout
    const [lastMove, setLastMove] = useState(null);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [promotionSquare, setPromotionSquare] = useState(null);
    const [copied, setCopied] = useState(false);

    // Format Time Helper
    const formatTime = (seconds) => {
        if (seconds === null) return "--:--";
        const m = Math.floor(Math.max(0, seconds) / 60);
        const s = Math.floor(Math.max(0, seconds) % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    useEffect(() => {
        // Socket Listeners
        socket.on('chess_room_created', ({ roomId: newRoomId, color, timeControl: tc }) => {
            setRoomId(newRoomId);
            setMyColor(color);
            setView('lobby');
            setPlayers([{ name: playerName, color, id: socket.id }]);
            // Init timer for self (will sync when p2 joins)
            if (tc) {
                setWhiteTime(tc * 60);
                setBlackTime(tc * 60);
            }
        });

        socket.on('chess_player_joined', ({ players, gameState, turn, timeControl: tc, whiteTime: wt, blackTime: bt }) => {
            setPlayers(players);
            const me = players.find(p => p.id === socket.id);
            if (me) setMyColor(me.color);

            // Sync Timers
            if (tc && !whiteTime) { // If joining, sync from server/host
                setTimeControl(tc);
                setWhiteTime(wt || tc * 60);
                setBlackTime(bt || tc * 60);
            }

            if (gameState === 'playing') {
                setView('game');
                setGameState('playing');
                setTimerActive(true); // Start clock
            }
        });

        socket.on('chess_move_made', ({ move, board, gameState, turn, whiteTime: wt, blackTime: bt }) => {
            setBoard(board);
            setGameState(gameState);
            setTurn(turn);
            setLastMove({ ...move, piece: board[move.to.row][move.to.col] });

            // Sync Times
            if (wt !== undefined) setWhiteTime(wt);
            if (bt !== undefined) setBlackTime(bt);

            // If game over, stop timer
            if (['checkmate', 'stalemate', 'timeout'].includes(gameState)) {
                setTimerActive(false);
            }
        });

        socket.on('chess_game_over', ({ reason, winner }) => {
            setGameState('timeout');
            setTimerActive(false);
            alert(`Game Over: ${reason}. Winner: ${winner === 'w' ? 'White' : 'Black'}`);
        });

        socket.on('chess_player_left', () => {
            alert('Opponent disconnected');
            setView('menu');
            setTimerActive(false);
        });

        socket.on('chess_error', ({ message }) => {
            alert(message);
        });

        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get('room');
        if (roomParam) {
            setRoomId(roomParam);
        }

        return () => {
            socket.off('chess_room_created');
            socket.off('chess_player_joined');
            socket.off('chess_move_made');
            socket.off('chess_game_over');
            socket.off('chess_player_left');
            socket.off('chess_error');
        };
    }, []);
    // Actually safer to keep dep array empty or correct. Empty is fine if we use functional updates or refs for mutable state, but here listeners are bound once.
    // The issue with empty dep array is that 'whiteTime' inside listeners might be stale if we accessed it, but we get it from payload. So it's fine.

    // Timer Countdown Effect
    useEffect(() => {
        let interval = null;
        if (timerActive && gameState === 'playing') {
            interval = setInterval(() => {
                if (turn === 'w') {
                    setWhiteTime(prev => {
                        if (prev === null) return prev;
                        if (prev <= 0) {
                            clearInterval(interval);
                            handleTimeout('w');
                            return 0;
                        }
                        return prev - 1;
                    });
                } else {
                    setBlackTime(prev => {
                        if (prev === null) return prev;
                        if (prev <= 0) {
                            clearInterval(interval);
                            handleTimeout('b');
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, gameState, turn]);

    const handleTimeout = (loserColor) => {
        setTimerActive(false);
        setGameState('timeout');
        // socket.emit('chess_timeout', { roomId, loser: loserColor }); 
        // We assume trusted client for now. 
        if (myColor !== loserColor) {
            // If I am NOT the loser, I claim the win? 
            // Or better, let the loser emit "I ran out of time". 
            // To be robust, BOTH might emit. Server handles 1st one.
            // For simplicity: If MY time runs out, *I* emit timeout.
        } else {
            socket.emit('chess_claim_timeout', { roomId, loser: myColor });
        }
    };

    // Helpers
    const createRoom = () => {
        if (!playerName.trim()) return alert('Enter name');
        socket.emit('chess_create_room', { playerName, timeControl });
    };

    const joinRoom = () => {
        if (!playerName.trim() || !roomId.trim()) return alert('Enter details');
        socket.emit('chess_join_room', { roomId, playerName });
    };

    const copyRoomId = () => {
        const url = `${window.location.origin}/chess/online?room=${roomId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Game Logic
    const handleSquareClick = (row, col) => {
        if (gameState !== 'playing' && gameState !== 'check') return;
        if (turn !== myColor) return;
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

        // Select Piece
        if (clickedPiece && clickedPiece.color === myColor) {
            setSelectedSquare({ row, col });
            const moves = getValidMoves(board, row, col, lastMove);
            setPossibleMoves(moves);
        } else {
            setSelectedSquare(null);
            setPossibleMoves([]);
        }
    };

    const executeMove = (fromRow, fromCol, toRow, toCol, moveDetails) => {
        const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
        let movingPiece = { ...newBoard[fromRow][fromCol], hasMoved: true };

        if (moveDetails.isPromotion) movingPiece.type = moveDetails.promotionType || 'q';

        newBoard[fromRow][fromCol] = null;
        newBoard[toRow][toCol] = movingPiece;

        if (moveDetails.isCastling) {
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

        if (moveDetails.isEnPassant) {
            const captureRow = fromRow;
            newBoard[captureRow][toCol] = null;
        }

        const thisMove = {
            piece: movingPiece,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            isDoubleJump: moveDetails.isDoubleJump
        };

        const nextTurn = turn === 'w' ? 'b' : 'w';
        const newState = checkGameState(newBoard, nextTurn, thisMove);

        setBoard(newBoard);
        setTurn(nextTurn);
        setLastMove(thisMove);
        setGameState(newState);
        setSelectedSquare(null);
        setPossibleMoves([]);
        setPromotionSquare(null);

        // Emit to Server with time
        socket.emit('chess_make_move', {
            roomId,
            move: thisMove,
            boardState: newBoard,
            gameState: newState,
            turn: nextTurn,
            whiteTime, // My current local time
            blackTime  // Opponent's time (unchanged during my turn)
        });

        // If game over locally
        if (['checkmate', 'stalemate'].includes(newState)) {
            setTimerActive(false);
        }
    };

    const handlePromotionSelect = (type) => {
        if (promotionSquare) {
            const { fromRow, fromCol, row, col, move } = promotionSquare;
            move.promotionType = type;
            executeMove(fromRow, fromCol, row, col, move);
        }
    };

    // Renders
    if (view === 'menu') {
        return (
            <div className="flex flex-col items-center justify-start min-h-screen pt-36 md:pt-40 p-4 text-white relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-900/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl z-10">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <Users className="text-emerald-400" size={32} />
                        </div>
                        <h2 className="text-3xl font-bold">Chess Online</h2>
                    </div>

                    <div className="space-y-6">
                        <input
                            type="text"
                            placeholder="Your Name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />

                        {/* Time Control Selector */}
                        <div className="flex flex-col text-left gap-1">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">Time Control</label>
                            <div className="flex gap-2">
                                {[5, 10, 30].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setTimeControl(m)}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${timeControl === m
                                            ? 'bg-emerald-600 border-emerald-500 text-white'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {m} min
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                placeholder="Room ID"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono uppercase"
                            />
                            <button onClick={joinRoom} className="bg-slate-700 hover:bg-slate-600 text-white px-6 rounded-xl font-bold transition-colors">
                                Join
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-900 text-slate-500">Or</span></div>
                        </div>

                        <button
                            onClick={createRoom}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                        >
                            Create New Room ({timeControl} min)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'lobby') {
        return (
            <div className="flex flex-col items-center justify-start min-h-screen pt-36 md:pt-40 p-4 text-white relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-900/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl z-10">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse text-blue-400">
                        <Wifi size={32} />
                    </div>

                    <h2 className="text-2xl font-bold mb-2">Waiting for opponent</h2>
                    <p className="text-slate-400 mb-8 text-sm">Share this code with your friend to start the game.</p>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 mb-8">
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Room Code</div>
                        <button
                            onClick={copyRoomId}
                            className="w-full flex items-center justify-center gap-3 group hover:opacity-80 transition-opacity"
                        >
                            <span className="text-4xl font-mono font-bold text-white tracking-widest">{roomId}</span>
                            {copied ? <Check className="text-emerald-400" size={20} /> : <Copy className="text-slate-500 group-hover:text-white transition-colors" size={20} />}
                        </button>
                        {copied && <div className="text-xs text-emerald-400 mt-2 font-medium">Copied to clipboard!</div>}
                    </div>

                    <div className="space-y-3">
                        <div className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-1">Players ({players.length}/2)</div>
                        {players.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-white/5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.color === 'w' ? 'bg-white text-black' : 'bg-slate-700 text-white'}`}>
                                    {p.color === 'w' ? 'W' : 'B'}
                                </div>
                                <span className="font-medium">{p.name} {p.id === socket.id ? '(You)' : ''}</span>
                                {p.id === socket.id && <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
                            </div>
                        ))}
                        {players.length === 1 && (
                            <div className="flex items-center gap-3 p-3 border border-dashed border-white/10 rounded-xl text-slate-500">
                                <div className="w-8 h-8 rounded-full bg-slate-800/50 animate-pulse"></div>
                                <span className="text-sm italic">Waiting for Player 2...</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/5 text-sm text-slate-500">
                        Time Control: <span className="text-white font-bold">{timeControl} min</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center pt-36 md:pt-40 pb-12 px-4">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-8 px-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-white/5">
                    <Wifi size={16} className="text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">Room: {roomId}</span>
                </div>
                <div className="w-10" />
            </div>

            {/* Timers & Status */}
            <div className="w-full flex justify-between items-end mb-4 px-2">
                {/* Opponent Info */}
                <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${myColor === 'w' ? 'bg-black border border-white/20' : 'bg-white'}`}></div>
                        <span className="text-sm font-bold text-slate-300">{myColor === 'w' ? 'Black' : 'White'} (Opponent)</span>
                    </div>
                    <div className={`text-2xl font-mono font-bold px-3 py-1 rounded-lg border ${turn !== myColor ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-slate-800 text-slate-500 border-white/10'}`}>
                        {formatTime(myColor === 'w' ? blackTime : whiteTime)}
                    </div>
                </div>

                {/* Game Status Text */}
                <div className="text-center pb-2">
                    <div className={`text-lg font-bold ${gameState === 'checkmate' || gameState === 'timeout' ? 'text-red-500 animate-pulse' :
                        gameState === 'check' ? 'text-orange-500' : 'text-slate-400'}`}>
                        {gameState === 'checkmate' ? "Checkmate!" :
                            gameState === 'timeout' ? "Time Out!" :
                                gameState === 'check' ? "Check!" :
                                    turn === myColor ? "Your Turn" : "Waiting..."}
                    </div>
                </div>

                {/* My Info */}
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-400">{myColor === 'w' ? 'White' : 'Black'} (You)</span>
                        <div className={`w-3 h-3 rounded-full ${myColor === 'w' ? 'bg-white' : 'bg-black border border-white/20'}`}></div>
                    </div>
                    <div className={`text-2xl font-mono font-bold px-3 py-1 rounded-lg border ${turn === myColor ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-slate-800 text-slate-500 border-white/10'}`}>
                        {formatTime(myColor === 'w' ? whiteTime : blackTime)}
                    </div>
                </div>
            </div>

            <Board
                board={board}
                onSquareClick={handleSquareClick}
                selectedSquare={selectedSquare}
                possibleMoves={possibleMoves}
                rotation={myColor === 'b'}
            />

            {/* Promotion Modal */}
            {promotionSquare && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl">
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

export default ChessOnline;
