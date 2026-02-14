
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trophy, Users, Globe } from 'lucide-react';

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

export default ChessMenu;
