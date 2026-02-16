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

const ALGORITHMS = [
    {
        title: "Sorting Visualizer",
        description: "Watch how Bubble, Merge, Quick, and other sorting algorithms work in real-time.",
        path: "/sort",
        color: "from-blue-500 to-cyan-400",
        icon: <ArrowRightLeft className="w-8 h-8 text-white" />
    },
    {
        title: "Pathfinding Visualizer",
        description: "Visualize Dijkstra, A*, and DFS finding the shortest path through a maze.",
        path: "/PathFinding",
        color: "from-purple-500 to-pink-500",
        icon: <Map className="w-8 h-8 text-white" />
    },
    {
        title: "Game of Life",
        description: "Interact with Conway's Cellular Automata. Create life, watch it evolve, or die out.",
        path: "/CellularAutomata",
        color: "from-green-400 to-emerald-600",
        icon: <Activity className="w-8 h-8 text-white" />
    },
    {
        title: "N-Pendulum",
        description: "Chaos Theory & Physics Simulation. Customize N-linked pendulums.",
        path: "/pendulum",
        color: "from-orange-500 to-red-500",
        icon: <Activity className="w-8 h-8 text-white" />
    },
    {
        title: "MST Visualizer",
        description: "Prim's & Kruskal's Algorithms. Find the minimum spanning tree of a graph.",
        path: "/mst",
        color: "from-teal-400 to-emerald-500",
        icon: <Share2 className="w-8 h-8 text-white" />
    },
    {
        title: "Convex Hull",
        description: "Smallest polygon containing a set of points. Graham Scan & Jarvis March.",
        path: "/convex-hull",
        color: "from-fuchsia-500 to-pink-600",
        icon: <Hexagon className="w-8 h-8 text-white" />
    },
    {
        title: "N-Queens",
        description: "Backtracking visualization. Place N queens on an NxN board safely.",
        path: "/nqueens",
        color: "from-rose-500 to-red-600",
        icon: <Grip className="w-8 h-8 text-white" />
    },
    {
        title: "Kinetic Clock",
        description: "A mesmerizing digital clock display made of 24 analog clocks.",
        path: "/KineticClock",
        color: "from-slate-600 to-slate-800",
        icon: <Clock className="w-8 h-8 text-white" />
    },
    {
        title: "Prime Spirals",
        description: "Visualize the distribution of prime numbers in a spiral pattern.",
        path: "/prime-spirals",
        color: "from-violet-500 to-purple-600",
        icon: <Tornado className="w-8 h-8 text-white" />
    },
];

const GAMES = [

    {
        title: "Sudoku Solver",
        description: "Visualize the backtracking algorithm solving a Sudoku puzzle instantly.",
        path: "/Sudoku",
        color: "from-amber-500 to-orange-400",
        icon: <Grid3x3 className="w-8 h-8 text-white" />
    },
    {
        title: "Falling Blocks",
        description: "The classic block stacking game.",
        path: "/FallingBlocks",
        color: "from-indigo-500 to-violet-500",
        icon: <LayoutGrid className="w-8 h-8 text-white" />
    },
    {
        title: "Minesweeper",
        description: "Clear the board without hitting a mine in this classic logic game.",
        path: "/Minesweeper",
        color: "from-red-500 to-orange-500",
        icon: <Bomb className="w-8 h-8 text-white" />
    },
    {
        title: "Flappy Bird",
        description: "Navigate the bird through the pipes. A simple yet addictive game.",
        path: "/FlappyBird",
        color: "from-yellow-400 to-orange-500",
        icon: <Ghost className="w-8 h-8 text-white" />
    },
    {
        title: "Forbidden Words",
        description: "Describe the word without saying forbidden terms. A classic party game.",
        path: "/ForbiddenWords",
        color: "from-pink-500 to-rose-500",
        icon: <MessageSquare className="w-8 h-8 text-white" />
    },
    {
        title: "Tic-Tac-Toe",
        description: "The classic game. Play Solo, Local PvP, or Online.",
        path: "/TicTacToe",
        color: "from-blue-400 to-purple-500",
        icon: <Crown className="w-8 h-8 text-white" />
    },
    {
        title: "Chess",
        description: "Strategize and checkmate your opponent in this timeless classic.",
        path: "/Chess",
        color: "from-emerald-500 to-cyan-500",
        icon: <Gamepad2 className="w-8 h-8 text-white" />
    },
    {
        title: "Kinetic Clock",
        description: "A mesmerizing digital clock display made of 24 analog clocks.",
        path: "/KineticClock",
        color: "from-slate-600 to-slate-800",
        icon: <Clock className="w-8 h-8 text-white" />
    },
    {
        title: "Wordle Helper",
        description: "Master Wordle with smart analysis, solver hints, and a full game mode.",
        path: "/wordle-helper",
        color: "from-green-500 to-emerald-600",
        icon: <MessageSquare className="w-8 h-8 text-white" /> 
    },
];

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
                <Link to={item.path} key={item.title} className="block group h-full">
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
