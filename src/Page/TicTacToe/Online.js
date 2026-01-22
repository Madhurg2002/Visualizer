
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Copy, Wifi, Users, User, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import Board from './Board';

const SERVER_URL = process.env.REACT_APP_SERVER_URL;

const OnlineTicTacToe = ({ onBack }) => {
    const [socket, setSocket] = useState(null);
    const [view, setView] = useState('lobby'); // lobby, playing
    const [searchParams, setSearchParams] = useSearchParams();
    const [roomId, setRoomId] = useState(searchParams.get('room') || '');
    const [playerName, setPlayerName] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Game State
    const [board, setBoard] = useState(Array(9).fill(null));
    const [players, setPlayers] = useState([]);
    const [mySymbol, setMySymbol] = useState(null);
    const [currentTurn, setCurrentTurn] = useState('X');
    const [winner, setWinner] = useState(null);
    const [winningLine, setWinningLine] = useState(null);
    const [gameState, setGameState] = useState('waiting');

    useEffect(() => {
        const newSocket = io(SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to server');
        });

        newSocket.on('ttt_room_created', (id) => {
            setRoomId(id);
            setSearchParams({ room: id });
            setView('playing'); // Or waiting room
        });

        newSocket.on('ttt_room_update', (room) => {
            setBoard(room.board);
            setPlayers(room.players);
            setCurrentTurn(room.currentTurn);
            setWinner(room.winner);
            setWinningLine(room.winningLine);
            setGameState(room.gameState);

            // Determine my symbol
            const me = room.players.find(p => p.id === newSocket.id);
            if (me) setMySymbol(me.symbol);

            if (view === 'lobby' && room.players.some(p => p.id === newSocket.id)) {
                setView('playing');
            }
        });

        newSocket.on('ttt_error', (msg) => {
            setError(msg);
        });

        return () => newSocket.close();
    }, []);

    const createRoom = () => {
        if (!playerName) return setError("Enter name first!");
        socket.emit('ttt_create_room', { name: playerName });
    };

    const joinRoom = () => {
        if (!playerName) return setError("Enter name first!");
        if (!roomId) return setError("Enter room ID!");
        socket.emit('ttt_join_room', { name: playerName, roomId: roomId.toUpperCase() });
    };

    const handleCellClick = (index) => {
        if (gameState !== 'playing' || currentTurn !== mySymbol) return;
        socket.emit('ttt_move', { roomId, index });
    };

    const handleReset = () => {
        socket.emit('ttt_reset', { roomId });
    };

    const copyRoomId = () => {
        const url = `${window.location.origin}/TicTacToe?room=${roomId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0B0C15] pt-36 md:pt-40 px-4 flex flex-col items-center justify-start relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-900/20 blur-[100px] rounded-full pointer-events-none" />

            {view === 'lobby' && (
                <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl z-10">
                    <button onClick={onBack} className="absolute top-4 left-4 text-slate-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </button>

                    <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-pink-400">
                        <Wifi size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-6">Online Play</h2>

                    {error && <div className="mb-4 p-3 bg-red-500/20 text-red-300 text-sm rounded-lg border border-red-500/30">{error}</div>}

                    <input
                        type="text"
                        placeholder="Your Name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    />

                    <div className="flex flex-col sm:flex-row gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Room ID"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all font-mono uppercase"
                        />
                        <button onClick={joinRoom} className="bg-slate-700 hover:bg-slate-600 text-white px-6 rounded-xl font-bold transition-colors">
                            Join
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-900 text-slate-500">Or</span></div>
                    </div>

                    <button
                        onClick={createRoom}
                        className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
                    >
                        Create New Room
                    </button>
                </div>
            )}

            {view === 'playing' && (
                <>
                    {/* HUD */}
                    <div className="w-full flex justify-between items-center mb-8 bg-slate-800/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md max-w-lg z-10">
                        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white">
                            <ArrowLeft size={24} />
                        </button>

                        <div className="flex flex-col items-center">
                            <div
                                onClick={copyRoomId}
                                className="cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 hover:text-white transition-colors"
                                title="Click to copy Room ID"
                            >
                                {copied ? <span className="text-green-400">Link Copied!</span> : <>{roomId} <Copy size={12} /></>}
                            </div>

                            <motion.div
                                key={winner || currentTurn}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`font-black text-2xl ${winner ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500' : 'text-white'}`}
                            >
                                {winner === 'Draw' ? "Draw!" : winner ? `${winner} Wins!` : (
                                    <span className="flex items-center gap-2">
                                        Turn: <span className={currentTurn === 'X' ? "text-blue-400" : "text-purple-400"}>{currentTurn}</span>
                                        {currentTurn === mySymbol && <span className="text-sm bg-green-500/20 text-green-400 px-2 py-0.5 rounded ml-2">YOU</span>}
                                    </span>
                                )}
                            </motion.div>
                        </div>

                        <div className="w-10"></div> {/* Spacer */}
                    </div>

                    {/* Board */}
                    <div className="relative z-10 max-w-lg w-full">
                        {gameState === 'waiting' && !winner && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-3xl">
                                <div className="text-center">
                                    <div className="animate-spin w-8 h-8 border-4 border-slate-500 border-t-white rounded-full mx-auto mb-4"></div>
                                    <h3 className="text-xl font-bold text-white">Waiting for Opponent...</h3>
                                    <p className="text-slate-400 text-sm mt-2">Share Room ID: <span className="font-mono text-pink-400">{roomId}</span></p>
                                </div>
                            </div>
                        )}

                        <Board squares={board} onClick={handleCellClick} winningLine={winningLine} />

                        {/* Game Over Overlay */}
                        <AnimatePresence>
                            {winner && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-3xl"
                                >
                                    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-white/10 text-center">
                                        <h3 className="text-3xl font-black text-white mb-4">
                                            {winner === 'Draw' ? '🤝 Draw!' : `🎉 ${winner} Won!`}
                                        </h3>
                                        <p className="text-slate-400 mb-6">
                                            {winner === mySymbol ? "You Won!" : winner === 'Draw' ? "Good Game!" : "Better luck next time!"}
                                        </p>
                                        <button
                                            onClick={handleReset}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                        >
                                            Play Again
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 flex justify-center gap-8 z-10">
                        {players.map(p => (
                            <div key={p.id} className={`flex flex-col items-center gap-2 ${p.symbol === currentTurn && !winner ? 'scale-110 pb-2' : 'opacity-70'} transition-all`}>
                                <div className={`p-3 rounded-full ${p.symbol === 'X' ? 'bg-blue-500/20 text-blue-400 border border-blue-500' : 'bg-purple-500/20 text-purple-400 border border-purple-500'}`}>
                                    {p.symbol === 'X' ? <User size={20} /> : <Users size={20} />}
                                </div>
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                    {p.name} {p.id === socket?.id && '(You)'}
                                    <span className="bg-slate-800 px-1.5 rounded text-white">{p.score}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default OnlineTicTacToe;
