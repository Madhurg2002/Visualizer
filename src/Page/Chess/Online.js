
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ArrowLeft, Copy, Check, Users, Wifi } from 'lucide-react';
import Board from './Board';
import { getValidMoves, checkGameState, initialBoard } from './logic';
const SERVER_URL = process.env.REACT_APP_SERVER_URL;

const socket = io(SERVER_URL);

const ChessOnline = ({ onBack }) => {
    const [view, setView] = useState('menu'); // menu, lobby, game
    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [myColor, setMyColor] = useState(null); // 'w' or 'b'

    // Game State
    const [board, setBoard] = useState(initialBoard);
    const [turn, setTurn] = useState('w');
    const [gameState, setGameState] = useState('waiting'); // waiting, playing, check, checkmate, stalemate
    const [lastMove, setLastMove] = useState(null);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [promotionSquare, setPromotionSquare] = useState(null);

    useEffect(() => {
        // Socket Listeners
        socket.on('chess_room_created', ({ roomId: newRoomId, color }) => {
            setRoomId(newRoomId);
            setMyColor(color);
            setView('lobby');
            setPlayers([{ name: playerName, color, id: socket.id }]);
        });

        socket.on('chess_player_joined', ({ players, gameState, turn }) => {
            setPlayers(players);
            // Identify my color if not set (i.e., if I am the joiner)
            const me = players.find(p => p.id === socket.id);
            if (me) {
                setMyColor(me.color);
            }

            if (gameState === 'playing') {
                setView('game');
                setGameState('playing');
            }
        });

        socket.on('chess_move_made', ({ move, board, gameState, turn }) => {
            setBoard(board);
            setGameState(gameState);
            setTurn(turn);
            setLastMove({ ...move, piece: board[move.to.row][move.to.col] }); // Reconstruct piece from board or pass explicit
            // Actually, server passes full board, so we just trust it.
            // Move highlight might need piece...
        });

        socket.on('chess_player_left', () => {
            alert('Opponent disconnected');
            setView('menu');
            // Reset state?
        });

        socket.on('chess_error', ({ message }) => {
            alert(message);
        });

        return () => {
            socket.off('chess_room_created');
            socket.off('chess_player_joined');
            socket.off('chess_move_made');
            socket.off('chess_player_left');
            socket.off('chess_error');
        };
    }, [playerName]);

    // Helpers
    const createRoom = () => {
        if (!playerName.trim()) return alert('Enter name');
        socket.emit('chess_create_room', { playerName });
    };

    const joinRoom = () => {
        if (!playerName.trim() || !roomId.trim()) return alert('Enter details');
        socket.emit('chess_join_room', { roomId, playerName });
    };

    const copyRoomId = () => {
        const url = `${window.location.origin}/chess?room=${roomId}`;
        navigator.clipboard.writeText(url);
    };

    // Game Logic (Mirroring Local logic but emitting moves)
    const handleSquareClick = (row, col) => {
        if (gameState !== 'playing' && gameState !== 'check') return;
        if (turn !== myColor) return; // Not my turn
        if (promotionSquare) return; // Block interaction if promotion pending

        const clickedPiece = board[row][col];
        const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;

        if (isSelected) {
            setSelectedSquare(null);
            setPossibleMoves([]);
            return;
        }

        // Move Piece
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
        // Optimistic Update
        const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
        let movingPiece = { ...newBoard[fromRow][fromCol], hasMoved: true };

        if (moveDetails.isPromotion) {
            movingPiece.type = moveDetails.promotionType || 'q';
        }

        newBoard[fromRow][fromCol] = null;
        newBoard[toRow][toCol] = movingPiece;

        // Castling
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

        // En Passant
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

        // Update Local
        setBoard(newBoard);
        setTurn(nextTurn);
        setLastMove(thisMove);
        setGameState(newState);
        setSelectedSquare(null);
        setPossibleMoves([]);
        setPromotionSquare(null);

        // Emit to Server
        socket.emit('chess_make_move', {
            roomId,
            move: thisMove,
            boardState: newBoard,
            gameState: newState,
            turn: nextTurn
        });
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                <h2 className="text-3xl font-bold mb-8">Chess Online</h2>
                <div className="w-full max-w-sm space-y-4">
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full p-4 bg-slate-800 rounded-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                    <button onClick={createRoom} className="w-full p-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold transition-all">
                        Create Room
                    </button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#0B0C15] text-slate-500">OR</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Room ID"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            className="flex-1 p-4 bg-slate-800 rounded-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 uppercase"
                        />
                        <button onClick={joinRoom} className="px-8 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition-all">
                            Join
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'lobby') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                <div className="bg-slate-900 p-8 rounded-2xl border border-white/10 text-center max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-2">Waiting for opponent...</h2>
                    <p className="text-slate-400 mb-6">Share this Room ID with a friend</p>

                    <button
                        onClick={copyRoomId}
                        className="w-full p-4 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-center gap-3 hover:bg-slate-750 transition-all mb-4 group"
                    >
                        <span className="text-3xl font-mono tracking-widest text-emerald-400">{roomId}</span>
                        {copied ? <Check className="text-emerald-400" /> : <Copy className="text-slate-400 group-hover:text-white" />}
                    </button>

                    <div className="space-y-2">
                        {players.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <div className={`w-3 h-3 rounded-full ${p.color === 'w' ? 'bg-white' : 'bg-slate-600'}`} />
                                <span>{p.name} {p.id === socket.id ? '(You)' : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center">
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

            <div className="text-center mb-6">
                <div className={`text-xl font-bold ${gameState === 'checkmate' ? 'text-red-500' :
                    gameState === 'check' ? 'text-orange-500' :
                        'text-slate-400'
                    }`}>
                    {gameState === 'checkmate' ? `Checkmate! ${turn === 'w' ? 'Black' : 'White'} Wins!` :
                        gameState === 'check' ? `${turn === 'w' ? 'White' : 'Black'} is in Check!` :
                            gameState === 'stalemate' ? "Stalemate!" :
                                `Turn: ${turn === 'w' ? 'White' : 'Black'}`}
                </div>
                <div className="text-sm text-emerald-400 mt-1">
                    You are playing as {myColor === 'w' ? 'White' : 'Black'}
                </div>
            </div>

            <Board
                board={board}
                onSquareClick={handleSquareClick}
                selectedSquare={selectedSquare}
                possibleMoves={possibleMoves} // Maybe highlight last move too?
                // Rotate board for Black?
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
