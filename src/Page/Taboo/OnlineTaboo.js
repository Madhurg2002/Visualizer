import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Check, X, SkipForward, Timer, Trophy, Users, Wifi, Copy } from 'lucide-react';
import io from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

const OnlineTaboo = ({ onBack }) => {
    const [socket, setSocket] = useState(null);
    const [view, setView] = useState('lobby'); // lobby, waiting, playing, end
    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [gameState, setGameState] = useState({});
    const [error, setError] = useState('');

    // Game State
    const [currentCard, setCurrentCard] = useState(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [isGiver, setIsGiver] = useState(false);
    const [giverId, setGiverId] = useState(null);

    useEffect(() => {
        const newSocket = io(SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to server');
            setError('');
        });

        newSocket.on('connect_error', () => {
            setError('Could not connect to server. Ensure it is running on port 3001.');
        });

        newSocket.on('room_update', (data) => {
            setPlayers(data.players);
            if (data.gameState === 'playing') {
                setView('playing');
            } else if (data.gameState === 'end') {
                setView('end');
                // You might want to grab final score from specific event if needed
            } else {
                setView('waiting');
            }
        });

        newSocket.on('game_state_update', (data) => {
            setCurrentCard(data.currentCard);
            setScore(data.score);
            setGiverId(data.giverId);
            setIsGiver(data.giverId === newSocket.id);
            if (data.gameState === 'end') {
                setView('end');
            }
        });

        newSocket.on('timer_update', (time) => {
            setTimeLeft(time);
        });

        newSocket.on('game_end', (data) => {
            setView('end');
            setScore(data.score); // Final score
        });

        return () => newSocket.close();
    }, []);

    const createRoom = () => {
        if (!playerName) return setError("Enter name first!");
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomId(newRoomId);
        joinRoom(newRoomId);
    };

    const joinRoom = (idToJoin) => {
        if (!playerName) return setError("Enter name first!");
        if (!idToJoin) return setError("Enter room ID!");

        socket.emit('join_room', { name: playerName, roomId: idToJoin });
        setRoomId(idToJoin);
    };

    const startGame = () => {
        socket.emit('start_game', roomId);
    };

    const handleAction = (action) => {
        if (!isGiver) return;
        socket.emit('game_action', { roomId, action });
    };

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        // Could show toast here
    };

    return (
        <div className="min-h-screen bg-[#0B0C15] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

            <button
                onClick={onBack}
                className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 z-50 transition-colors"
            >
                Exit to Menu
            </button>

            <AnimatePresence mode="wait">
                {view === 'lobby' && (
                    <motion.div
                        key="lobby"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl z-10"
                    >
                        <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-400">
                            <Wifi size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-6">Online Multi-play</h2>

                        {error && <div className="mb-4 p-3 bg-red-500/20 text-red-300 text-sm rounded-lg border border-red-500/30">{error}</div>}

                        <input
                            type="text"
                            placeholder="Your Name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        />

                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                placeholder="Room ID"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono uppercase"
                            />
                            <button onClick={() => joinRoom(roomId)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 rounded-xl font-bold transition-colors">
                                Join
                            </button>
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-slate-900 text-slate-500">Or</span>
                            </div>
                        </div>

                        <button
                            onClick={createRoom}
                            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
                        >
                            Create New Room
                        </button>
                    </motion.div>
                )}

                {view === 'waiting' && (
                    <motion.div
                        key="waiting"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl z-10"
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Waiting Lobby</h2>
                                <p className="text-slate-400 text-sm">Waiting for host to start...</p>
                            </div>
                            <div
                                onClick={copyRoomId}
                                className="cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors border border-white/5"
                            >
                                <span className="font-mono font-bold text-purple-400">{roomId}</span>
                                <Copy size={16} className="text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-3 mb-8">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Players ({players.length})</h3>
                            {players.map(p => (
                                <div key={p.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-white font-medium">{p.name} {p.id === socket.id ? '(You)' : ''}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={startGame}
                            className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                        >
                            <Play size={20} fill="currentColor" />
                            Start Game
                        </button>
                    </motion.div>
                )}

                {view === 'playing' && (
                    <motion.div
                        key="playing"
                        className="w-full max-w-md z-10"
                    >
                        {/* HUD */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 px-4 py-2 rounded-full border border-white/10">
                                <Timer size={20} className="text-blue-400" />
                                <span className="font-mono text-xl font-bold">{timeLeft}s</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 px-4 py-2 rounded-full border border-white/10">
                                <Trophy size={20} className="text-yellow-400" />
                                <span className="font-mono text-xl font-bold">{score}</span>
                            </div>
                        </div>

                        {isGiver ? (
                            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-300 mb-8 relative">
                                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 text-center">
                                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-2">You are the Giver</p>
                                    <h2 className="text-4xl font-black text-white uppercase tracking-wider drop-shadow-md mb-2">
                                        {currentCard?.word}
                                    </h2>
                                </div>

                                <div className="p-6 bg-white flex flex-col items-center gap-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                        Forbidden Words
                                    </div>
                                    {currentCard?.forbidden.map((word, idx) => (
                                        <div key={idx} className="text-xl font-bold text-slate-700 py-1 border-b border-slate-100 last:border-0 w-full text-center">
                                            {word}
                                        </div>
                                    ))}
                                </div>
                                <div className="h-2 bg-gradient-to-r from-pink-500 to-purple-600"></div>
                            </div>
                        ) : (
                            <div className="bg-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-8 border border-white/10 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <Users size={40} className="text-blue-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Guess the Word!</h2>
                                <p className="text-slate-400">
                                    {players.find(p => p.id === giverId)?.name || 'Someone'} is giving clues.
                                </p>
                            </div>
                        )}

                        {isGiver && (
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleAction('taboo')}
                                    className="flex flex-col items-center justify-center gap-1 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all active:scale-95"
                                >
                                    <X size={32} />
                                    <span className="text-sm font-bold">Taboo</span>
                                </button>

                                <button
                                    onClick={() => handleAction('skip')}
                                    className="flex flex-col items-center justify-center gap-1 p-4 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/20 transition-all active:scale-95"
                                >
                                    <SkipForward size={32} />
                                    <span className="text-sm font-bold">Skip</span>
                                </button>

                                <button
                                    onClick={() => handleAction('correct')}
                                    className="flex flex-col items-center justify-center gap-1 p-4 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-2xl border border-green-500/20 transition-all active:scale-95"
                                >
                                    <Check size={32} />
                                    <span className="text-sm font-bold">Correct</span>
                                </button>
                            </div>
                        )}
                        {!isGiver && (
                            <div className="text-center text-slate-500 text-sm mt-4 italic">
                                Shout out your answers!
                            </div>
                        )}
                    </motion.div>
                )}

                {view === 'end' && (
                    <motion.div
                        key="end"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl z-10"
                    >
                        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-400">
                            <Trophy size={40} />
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
                        <p className="text-slate-400 mb-8">Team Score</p>

                        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">
                            {score}
                        </div>

                        <button
                            onClick={startGame}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            <Play size={24} fill="currentColor" />
                            Play Again
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OnlineTaboo;
