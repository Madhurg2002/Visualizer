import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Wifi, ArrowLeft } from 'lucide-react';
import OnlineForbiddenWords from './Online';
import LocalForbiddenWords from './Local';

const ForbiddenWordsMenu = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-start p-4 relative overflow-hidden w-full h-full">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Back Button */}
            <div className="absolute top-0 left-4 md:left-8 z-20">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white transition-all shadow-lg"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative z-10 mt-12"
            >
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
                    Taboo
                </h1>
                <p className="text-slate-400 mb-8">Choose your game mode</p>

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('local')}
                        className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-4 transition-all group"
                    >
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Local Party</h3>
                            <p className="text-slate-400 text-sm">Pass the phone around</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('online')}
                        className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-4 transition-all group"
                    >
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Wifi size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">Online Multiplayer</h3>
                            <p className="text-slate-400 text-sm">Play with friends remotely</p>
                        </div>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default function ForbiddenWords() {
    const navigate = useNavigate();

    return (
        <div className="min-h-full w-full">
            <Routes>
                <Route index element={<ForbiddenWordsMenu />} />
                <Route path="local" element={<LocalForbiddenWords onBack={() => navigate('/ForbiddenWords')} />} />
                <Route path="online" element={<OnlineForbiddenWords onBack={() => navigate('/ForbiddenWords')} />} />
            </Routes>
        </div>
    );
};
