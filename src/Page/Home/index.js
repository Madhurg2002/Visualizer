import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRightLeft,
    Map,
    Grid3x3,
    Activity,
    LayoutGrid,
    Bomb,
    Ghost,
    Crown,
    MessageSquare,
    Gamepad2,
    Clock,
    Share2,
    Hexagon,
    Grip,
    Tornado
} from 'lucide-react';

import { ALGORITHMS, GAMES } from '../../data/visualizers';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
};



const VisualizerSection = ({ title, items }) => (
    <div className="mb-20">
        <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-slate-300 mb-8 border-l-4 border-blue-500 pl-4"
        >
            {title}
        </motion.h2>
        <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
            {items.map((item) => (
                <Link to={item.linkPath || item.path} key={item.title} className="block group h-full">
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-colors h-full"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                        <div className="p-8 flex flex-col h-full">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                {item.icon}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-colors">
                                {item.title}
                            </h3>

                            <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors flex-grow">
                                {item.description}
                            </p>
                        </div>
                    </motion.div>
                </Link>
            ))}
        </motion.div>
    </div>
);

const Home = () => {
    return (
        <div className="min-h-full px-4 bg-[#0B0C15] overflow-hidden relative">

            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto z-10 relative">

                {/* Hero Section */}
                <div className="text-center mb-20 space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-6xl md:text-8xl font-black text-white tracking-tight"
                    >
                        Algorithm <br className="md:hidden" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            Visualizer
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed"
                    >
                        Master algorithms and challenge yourself with classic games.
                    </motion.p>
                </div>

                <VisualizerSection title="Classic Games" items={GAMES} />
                <VisualizerSection title="Interactive Algorithms" items={ALGORITHMS} />

            </div>
        </div>
    );
};

export default Home;
