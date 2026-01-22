import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Users, Globe, ArrowLeft, Gamepad2 } from 'lucide-react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import LocalTicTacToe from './Local.js';
import OnlineTicTacToe from './Online.js';

const TicTacToeMenu = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 relative w-full h-full">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Back Button */}
            <div className="absolute top-0 left-4 md:left-8 z-20">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-4xl z-10 flex flex-col items-center mt-12"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="text-center mb-12">
                    <div className="inline-block p-4 rounded-3xl bg-slate-800/50 border border-white/5 mb-6 shadow-2xl backdrop-blur-sm">
                        <Gamepad2 size={48} className="text-blue-400" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm mb-4">
                        Tic-Tac-Toe
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                        The classic game reimagined. Challenge AI, play locally with friends, or compete online in real-time.
                    </p>
                </motion.div>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4">
                    {/* Single Player */}
                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('ai')}
                        className="group relative h-64 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-800/60 hover:border-blue-500/30 overflow-hidden shadow-2xl"
                    >
                        <div className="mb-6 p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                            <User size={40} className="text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Single Player</h3>
                        <p className="text-slate-400 text-sm">Train against our Unbeatable Minimax AI.</p>

                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.button>

                    {/* Local Multiplayer */}
                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('local')}
                        className="group relative h-64 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-800/60 hover:border-purple-500/30 overflow-hidden shadow-2xl"
                    >
                        <div className="mb-6 p-4 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors">
                            <Users size={40} className="text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Local PvP</h3>
                        <p className="text-slate-400 text-sm">Two players on the same device.</p>

                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.button>

                    {/* Online Multiplayer */}
                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('online')}
                        className="group relative h-64 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-800/60 hover:border-pink-500/30 overflow-hidden shadow-2xl"
                    >
                        <div className="mb-6 p-4 bg-pink-500/10 rounded-2xl group-hover:bg-pink-500/20 transition-colors">
                            <Globe size={40} className="text-pink-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Online PvP</h3>
                        <p className="text-slate-400 text-sm">Create a room and challenge friends remotely.</p>

                        <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

const TicTacToe = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-full w-full">
            <Routes>
                <Route index element={<TicTacToeMenu />} />
                <Route path="ai" element={<LocalTicTacToe mode="ai" onBack={() => navigate('/TicTacToe')} />} />
                <Route path="local" element={<LocalTicTacToe mode="local" onBack={() => navigate('/TicTacToe')} />} />
                <Route path="online" element={<OnlineTicTacToe onBack={() => navigate('/TicTacToe')} />} />
            </Routes>
        </div>
    );
};

export default TicTacToe;
