import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Check, X, SkipForward, Timer, Trophy, Users, Wifi, Copy, ArrowRightLeft, Eye, Server, ArrowLeft } from 'lucide-react';
import io from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_SERVER_URL;

const OnlineTaboo = ({ onBack }) => {
    const [socket, setSocket] = useState(null);
    const [view, setView] = useState('lobby'); // lobby, waiting, playing, end
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [scores, setScores] = useState({ A: 0, B: 0 });
    const [currentTeam, setCurrentTeam] = useState('A');
    const [hostId, setHostId] = useState(null);
    const [settings, setSettings] = useState({ roundTime: 5, totalRounds: 10 });
    const [currentRound, setCurrentRound] = useState(1);
    const [turnScore, setTurnScore] = useState(0);
    const [error, setError] = useState('');

    // Game State
    const [currentCard, setCurrentCard] = useState(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [turnStatus, setTurnStatus] = useState('playing'); // 'waiting', 'playing'
    const [giverId, setGiverId] = useState(null);
    const [guessInput, setGuessInput] = useState('');

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const roomParam = searchParams.get('room');
        if (roomParam) {
            setRoomId(roomParam);
        }

        const newSocket = io(SERVER_URL);
        setSocket(newSocket);

        // ... (rest of socket init)

        newSocket.on('connect', () => {
            console.log('Connected to server');
            setError('');
            setConnectionStatus('connected');
        });

        newSocket.on('connect_error', () => {
            // For serverless cold starts, we don't want to show the error screen immediately.
            // Socket.io will automatically retry. We just update the message.
            setError('Server might be sleeping. Waking it up...');
        });

        newSocket.on('room_update', (data) => {
            console.log("Room Update Data:", data);
            setPlayers(data.players);
            if (data.hostId) setHostId(data.hostId);
            if (data.giverId) setGiverId(data.giverId);
            if (data.settings) setSettings(data.settings);
            // Default to playing if turnStatus is undefined for legacy support, BUT verify if data.turnStatus is present
            console.log("Turn Status received:", data.turnStatus);

            // Should set turn status here? NO, turn status was missing here!
            // WAIT! The code in view_file showed lines 51-60 WITHOUT setTurnStatus!
            // I only added checks for gameState.
            // I MUST ADD setTurnStatus here!
            setTurnStatus(data.turnStatus || 'playing');
            if (data.currentRound) setCurrentRound(data.currentRound);
            if (data.turnScore !== undefined) setTurnScore(data.turnScore);

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
            setScores(data.scores);
            setGiverId(data.giverId);
            setCurrentTeam(data.currentTeam);
            setHostId(data.hostId);
            setTurnStatus(data.turnStatus || 'playing'); // Default to playing for legacy/init logic
            if (data.currentRound) setCurrentRound(data.currentRound);
            if (data.turnScore !== undefined) setTurnScore(data.turnScore);
            if (data.settings) setSettings(data.settings);
            if (data.gameState === 'end') {
                setView('end');
            } else if (data.gameState === 'playing') {
                setView('playing');
            }
        });

        newSocket.on('timer_update', (time) => {
            setTimeLeft(time);
        });

        newSocket.on('game_end', (data) => {
            setView('end');
            setScores(data.scores);
        });

        newSocket.on('room_created', (newRoomId) => {
            setRoomId(newRoomId);
            setSearchParams({ room: newRoomId });
        });

        return () => newSocket.close();
    }, []);

    const createRoom = () => {
        if (!playerName) return setError("Enter name first!");
        // Server now handles generation and uniqueness
        socket.emit('create_room', { name: playerName });
    };

    const joinRoom = (idToJoin) => {
        if (!playerName) return setError("Enter name first!");
        if (!idToJoin) return setError("Enter room ID!");

        socket.emit('join_room', { name: playerName, roomId: idToJoin });
        setRoomId(idToJoin);
        setSearchParams({ room: idToJoin });
    };

    const startGame = () => {
        socket.emit('start_game', roomId);
    };

    const handleAction = (action) => {
        // Validation handled by backend and UI button visibility
        socket.emit('game_action', { roomId, action });
    };

    const switchTeam = (team, playerId = null) => {
        socket.emit('switch_team', { roomId, team, playerId });
    };

    const submitGuess = (guess) => {
        if (!guess.trim()) return;
        socket.emit('submit_guess', { roomId, guess });
        setGuessInput(''); // Clear input
    };

    const randomizeTeams = () => {
        socket.emit('randomize_teams', roomId);
    };

    const updateSettings = (newSettings) => {
        socket.emit('update_settings', { roomId, settings: newSettings });
    };

    const startTurnTimer = () => {
        socket.emit('start_turn_timer', { roomId });
    };

    const copyRoomId = () => {
        const url = `${window.location.origin}/ForbiddenWords?room=${roomId}`;
        navigator.clipboard.writeText(url);
    };

    const myPlayer = players.find(p => p.id === socket?.id);
    const isGiver = socket?.id === giverId;
    const isHost = socket?.id === hostId;
    const isOpponent = myPlayer?.team && myPlayer?.team !== 'Spectator' && myPlayer?.team !== currentTeam;

    return (
        <div className="min-h-screen bg-[#0B0C15] flex flex-col items-center justify-start pt-36 md:pt-40 p-4 relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

            {(!isGiver || turnStatus !== 'waiting') && (
                <div className="absolute top-24 left-0 right-0 w-full z-40 pointer-events-none px-4">
                    <div className="max-w-7xl mx-auto px-6">
                        <button
                            onClick={onBack}
                            className="pointer-events-auto px-4 py-2 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <ArrowLeft size={16} />
                            <span className="font-bold text-sm">Exit</span>
                        </button>
                    </div>
                </div>
            )}

            {connectionStatus === 'connecting' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0C15] w-full h-full">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                        <Server size={64} className="text-purple-400 relative z-10 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">Initiating Server</h2>
                    <p className="text-slate-400 text-sm mb-4">Establishing secure connection via Socket.IO...</p>
                    {error && (
                        <p className="text-yellow-400 text-xs mb-4 animate-pulse">{error}</p>
                    )}

                    <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden mb-8">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        />
                    </div>

                    <button
                        onClick={() => { setConnectionStatus('error'); setError('Connection cancelled by user.'); }}
                        className="text-slate-500 hover:text-white text-sm underline transition-colors"
                    >
                        Cancel & Return to Lobby
                    </button>
                </div>
            )}

            <AnimatePresence mode="wait">
                {(connectionStatus === 'connected' || connectionStatus === 'error') && view === 'lobby' && (
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

                        <div className="flex flex-col sm:flex-row gap-2 mb-6">
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
                        className="max-w-2xl w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl z-10"
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

                        {/* Game Settings */}
                        <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Game Settings</h3>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-300">Round Time</span>
                                        <span className="text-white font-bold">{settings.roundTime}s</span>
                                    </div>
                                    {isHost ? (
                                        <input
                                            type="range"
                                            min="30"
                                            max="180"
                                            step="10"
                                            value={settings.roundTime}
                                            onChange={(e) => updateSettings({ roundTime: parseInt(e.target.value) })}
                                            className="w-full accent-purple-500"
                                        />
                                    ) : (
                                        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-500" style={{ width: `${(settings.roundTime / 180) * 100}%` }}></div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-300">Total Rounds</span>
                                        <span className="text-white font-bold">{settings.totalRounds}</span>
                                    </div>
                                    {isHost ? (
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            step="1"
                                            value={settings.totalRounds}
                                            onChange={(e) => updateSettings({ totalRounds: parseInt(e.target.value) })}
                                            className="w-full accent-purple-500"
                                        />
                                    ) : (
                                        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-500" style={{ width: `${(settings.totalRounds / 10) * 100}%` }}></div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-300">Input Mode</span>
                                        <span className="text-white font-bold capitalize">{settings.inputMode || 'button'}</span>
                                    </div>
                                    {isHost ? (
                                        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                                            {['button', 'typing'].map(mode => (
                                                <button
                                                    key={mode}
                                                    onClick={() => updateSettings({ inputMode: mode })}
                                                    className={`flex-1 py-1 text-xs font-bold rounded capitalize transition-colors ${settings.inputMode === mode ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-500 italic">Determined by host</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isHost && (
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={randomizeTeams}
                                    className="text-xs flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-white/5"
                                >
                                    <ArrowRightLeft size={14} />
                                    Randomize Teams
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {['A', 'B'].map(team => (
                                <div key={team} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            Team {team}
                                        </h3>
                                        <button
                                            onClick={() => switchTeam(team)}
                                            disabled={myPlayer?.team === team}
                                            className={`text-[10px] px-2 py-1 rounded border ${myPlayer?.team === team ? 'border-green-500 text-green-500 opacity-50 cursor-default' : 'border-slate-500 text-slate-400 hover:text-white hover:border-white'
                                                }`}
                                        >
                                            {myPlayer?.team === team ? 'Joined' : 'Join'}
                                        </button>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        {players.filter(p => p.team === team).map(p => (
                                            <div key={p.id} className="group relative flex items-center gap-2 text-xs text-slate-300 bg-black/20 p-2 rounded-lg">
                                                <div className={`w-2 h-2 rounded-full ${p.id === socket.id ? 'bg-green-400' : 'bg-slate-600'}`}></div>
                                                <span className="truncate max-w-[80px]">{p.name} {p.id === socket.id ? '(You)' : ''}</span>
                                                {p.id === hostId && <Trophy size={10} className="text-yellow-500 flex-shrink-0" />}

                                                {/* Host Controls */}
                                                {isHost && p.id !== socket.id && (
                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex bg-slate-800 rounded border border-white/10 overflow-hidden shadow-xl z-20">
                                                        {['A', 'B'].filter(t => t !== team).map(target => (
                                                            <button
                                                                key={target}
                                                                onClick={(e) => { e.stopPropagation(); switchTeam(target, p.id); }}
                                                                className="px-2 py-1 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white uppercase"
                                                                title={`Move to ${target}`}
                                                            >
                                                                {target.charAt(0)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {players.filter(p => p.team === team).length === 0 && (
                                            <div className="text-slate-600 text-[10px] italic text-center py-2">Empty</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>



                        {isHost ? (
                            <button
                                onClick={startGame}
                                className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                            >
                                <Play size={20} fill="currentColor" />
                                Start Game
                            </button>
                        ) : (
                            <div className="w-full py-4 bg-slate-800 rounded-xl text-slate-500 font-bold text-lg text-center border border-white/5">
                                Waiting for host to start...
                            </div>
                        )}
                    </motion.div>
                )}

                {view === 'playing' && (
                    <motion.div
                        key="playing"
                        className="w-full max-w-lg z-10"
                    >
                        {/* HUD */}
                        <div className="flex justify-between items-center mb-4">
                            <div className={`flex flex-col items-center p-3 rounded-xl border ${currentTeam === 'A' ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-800/50 border-transparent'} min-w-[100px]`}>
                                <span className="text-xs font-bold text-slate-400 uppercase">Team A</span>
                                <span className="text-3xl font-black text-white">{scores.A}</span>
                                <div className="mt-2 text-[10px] text-slate-400 flex flex-col items-center">
                                    {players.filter(p => p.team === 'A').map(p => (
                                        <div key={p.id} className="flex items-center gap-1">
                                            {p.id === giverId && <span className="text-yellow-500" title="Giver">👑</span>}
                                            <span className={p.id === socket.id ? 'text-white font-bold' : ''}>{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="text-slate-300 bg-slate-800/80 px-4 py-1 rounded-full border border-white/10 mb-2">
                                    <span className="font-mono text-xl font-bold text-white">{timeLeft}s</span>
                                </div>
                                <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest animate-pulse">
                                    Team {currentTeam}'s Turn
                                </div>
                            </div>

                            <div className={`flex flex-col items-center p-3 rounded-xl border ${currentTeam === 'B' ? 'bg-pink-500/20 border-pink-500' : 'bg-slate-800/50 border-transparent'} min-w-[100px]`}>
                                <span className="text-xs font-bold text-slate-400 uppercase">Team B</span>
                                <span className="text-3xl font-black text-white">{scores.B}</span>
                                <div className="mt-2 text-[10px] text-slate-400 flex flex-col items-center">
                                    {players.filter(p => p.team === 'B').map(p => (
                                        <div key={p.id} className="flex items-center gap-1">
                                            {p.id === giverId && <span className="text-yellow-500" title="Giver">👑</span>}
                                            <span className={p.id === socket.id ? 'text-white font-bold' : ''}>{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Round & Turn Info */}
                        <div className="flex justify-between items-center px-4 mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <div>Round {currentRound} / {settings.totalRounds}</div>
                            {turnStatus === 'playing' && (
                                <div className="text-white">Turn Score: <span className="text-green-400">{turnScore}</span></div>
                            )}
                        </div>

                        {(isGiver || isOpponent) ? (
                            <div className={`bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-300 mb-8 relative ${isOpponent ? 'border-4 border-red-500' : ''}`}>
                                {turnStatus === 'waiting' ? (
                                    <div className="p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
                                        {isGiver ? (
                                            <>
                                                <h3 className="text-2xl font-black text-slate-800 uppercase mb-4">You are the Giver!</h3>
                                                <p className="text-slate-500 mb-8">Get ready to describe words to your team.</p>
                                                <button
                                                    onClick={startTurnTimer}
                                                    className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-xl shadow-lg transition-transform active:scale-95 animate-bounce"
                                                >
                                                    Start Turn
                                                </button>
                                            </>
                                        ) : (
                                            // Opponent View
                                            <>
                                                <h3 className="text-xl font-bold text-slate-800 uppercase mb-2">Waiting for Giver...</h3>
                                                <p className="text-slate-500 text-sm">Team {currentTeam} is about to start.</p>
                                                <div className="mt-8 animate-spin w-8 h-8 border-4 border-slate-200 border-t-purple-500 rounded-full"></div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 text-center">
                                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-2">{isGiver ? 'You are the Giver' : 'Monitor for Forbidden!'}</p>
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
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-8 border border-white/10 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                                {turnStatus === 'waiting' ? (
                                    <>
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                            <Users size={32} className="text-slate-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-300 uppercase mb-2">Please Wait</h3>
                                        <p className="text-slate-500">Waiting for {players.find(p => p.id === giverId)?.name || 'Giver'} to start...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                            <Users size={40} className="text-blue-400" />
                                        </div>

                                        {myPlayer?.team === currentTeam ? (
                                            <>
                                                <h2 className="text-2xl font-bold text-white mb-2">Guess the Word!</h2>
                                                {/* ... remainder is same ... */}
                                                <p className="text-slate-400 mb-6">
                                                    {players.find(p => p.id === giverId)?.name || 'Teammate'} is giving clues.
                                                </p>

                                                {settings.inputMode === 'typing' ? (
                                                    <div className="w-full max-w-xs">
                                                        <input
                                                            type="text"
                                                            value={guessInput}
                                                            onChange={(e) => setGuessInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && submitGuess(guessInput)}
                                                            placeholder="Type your guess..."
                                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none text-center font-bold"
                                                            autoFocus
                                                        />
                                                        <div className="text-xs text-slate-500 mt-2">Press Enter to submit</div>
                                                    </div>
                                                ) : (
                                                    <p className="text-green-400 font-bold mt-4 uppercase">It's your team's turn!</p>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="text-2xl font-bold text-slate-500 mb-2">Spectating...</h2>
                                                <p className="text-slate-600">
                                                    Team {currentTeam} is playing.
                                                </p>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Controls */}
                        {isOpponent && turnStatus === 'playing' && (
                            <button
                                onClick={() => handleAction('forbidden')}
                                className="w-full flex items-center justify-center gap-2 p-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-xl transition-all active:scale-95 mb-4"
                            >
                                <X size={40} />
                                <span className="text-2xl font-black uppercase">Forbidden!</span>
                            </button>
                        )}

                        {isGiver && turnStatus === 'playing' && (
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleAction('skip')}
                                    className="flex flex-col items-center justify-center gap-1 p-4 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/20 transition-all active:scale-95"
                                >
                                    <SkipForward size={32} />
                                    <span className="text-sm font-bold">Skip</span>
                                </button>

                                {settings.inputMode !== 'typing' && (
                                    <button
                                        onClick={() => handleAction('correct')}
                                        className="flex flex-col items-center justify-center gap-1 p-4 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-2xl border border-green-500/20 transition-all active:scale-95"
                                    >
                                        <Check size={32} />
                                        <span className="text-sm font-bold">Correct</span>
                                    </button>
                                )}
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

                        <h2 className="text-3xl font-bold text-white mb-8">Game Over!</h2>

                        <div className="flex gap-8 justify-center mb-8">
                            <div className="text-center">
                                <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Team A</p>
                                <div className="text-6xl font-black text-white">{scores.A}</div>
                            </div>
                            <div className="w-px bg-white/10"></div>
                            <div className="text-center">
                                <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Team B</p>
                                <div className="text-6xl font-black text-white">{scores.B}</div>
                            </div>
                        </div>

                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">
                            {scores.A > scores.B ? "Team A Wins!" : scores.B > scores.A ? "Team B Wins!" : "It's a Tie!"}
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
        </div >
    );
};

export default OnlineTaboo;
