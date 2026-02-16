import React, { lazy } from 'react';
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

// Lazy Load Components
const Sort = lazy(() => import("../Page/Algorithm/Sorting"));
const PathFinding = lazy(() => import("../Page/Algorithm/Pathfinding"));
const CellularAutomata = lazy(() => import('../Page/Algorithm/CellularAutomata'));
const KineticClock = lazy(() => import('../Page/Games/KineticClock')); 
const NQueens = lazy(() => import('../Page/Algorithm/NQueens'));
const PrimeSpirals = lazy(() => import('../Page/Algorithm/PrimeSpirals'));
const ConvexHull = lazy(() => import('../Page/Algorithm/ConvexHull'));
const MST = lazy(() => import('../Page/Algorithm/MST'));
const Pendulum = lazy(() => import('../Page/Algorithm/Pendulum/Pendulum'));

const Sudoku = lazy(() => import('../Page/Games/Sudoku'));
const FallingBlocks = lazy(() => import('../Page/Games/FallingBlocks'));
const Minesweeper = lazy(() => import('../Page/Games/Minesweeper'));
const FlappyBird = lazy(() => import('../Page/Games/FlappyBird'));
const ForbiddenWords = lazy(() => import('../Page/Games/ForbiddenWords'));
const TicTacToe = lazy(() => import('../Page/Games/TicTacToe'));
const Chess = lazy(() => import('../Page/Games/Chess'));
const WordleHelper = lazy(() => import('../Page/Games/WordleHelper'));

export const ALGORITHMS = [
    {
        title: "Sorting Visualizer",
        description: "Watch how Bubble, Merge, Quick, and other sorting algorithms work in real-time.",
        path: "/sort",
        component: Sort,
        color: "from-blue-500 to-cyan-400",
        icon: <ArrowRightLeft className="w-8 h-8 text-white" />
    },
    {
        title: "Pathfinding Visualizer",
        description: "Visualize Dijkstra, A*, and DFS finding the shortest path through a maze.",
        path: "/PathFinding",
        component: PathFinding,
        color: "from-purple-500 to-pink-500",
        icon: <Map className="w-8 h-8 text-white" />
    },
    {
        title: "Game of Life",
        description: "Interact with Conway's Cellular Automata. Create life, watch it evolve, or die out.",
        path: "/CellularAutomata",
        component: CellularAutomata,
        color: "from-green-400 to-emerald-600",
        icon: <Activity className="w-8 h-8 text-white" />
    },
    {
        title: "N-Pendulum",
        description: "Chaos Theory & Physics Simulation. Customize N-linked pendulums.",
        path: "/pendulum",
        component: Pendulum,
        color: "from-orange-500 to-red-500",
        icon: <Activity className="w-8 h-8 text-white" />
    },
    {
        title: "MST Visualizer",
        description: "Prim's & Kruskal's Algorithms. Find the minimum spanning tree of a graph.",
        path: "/mst",
        component: MST,
        color: "from-teal-400 to-emerald-500",
        icon: <Share2 className="w-8 h-8 text-white" />
    },
    {
        title: "Convex Hull",
        description: "Smallest polygon containing a set of points. Graham Scan & Jarvis March.",
        path: "/convex-hull",
        component: ConvexHull,
        color: "from-fuchsia-500 to-pink-600",
        icon: <Hexagon className="w-8 h-8 text-white" />
    },
    {
        title: "N-Queens",
        description: "Backtracking visualization. Place N queens on an NxN board safely.",
        path: "/nqueens",
        component: NQueens,
        color: "from-rose-500 to-red-600",
        icon: <Grip className="w-8 h-8 text-white" />
    },
    {
        title: "Kinetic Clock",
        description: "A mesmerizing digital clock display made of 24 analog clocks.",
        path: "/KineticClock",
        component: KineticClock,
        color: "from-slate-600 to-slate-800",
        icon: <Clock className="w-8 h-8 text-white" />
    },
    {
        title: "Prime Spirals",
        description: "Visualize the distribution of prime numbers in a spiral pattern.",
        path: "/prime-spirals",
        component: PrimeSpirals,
        color: "from-violet-500 to-purple-600",
        icon: <Tornado className="w-8 h-8 text-white" />
    },
];

export const GAMES = [
    {
        title: "Sudoku Solver",
        description: "Visualize the backtracking algorithm solving a Sudoku puzzle instantly.",
        path: "/Sudoku",
        component: Sudoku,
        color: "from-amber-500 to-orange-400",
        icon: <Grid3x3 className="w-8 h-8 text-white" />
    },
    {
        title: "Falling Blocks",
        description: "The classic block stacking game.",
        path: "/FallingBlocks",
        component: FallingBlocks,
        color: "from-indigo-500 to-violet-500",
        icon: <LayoutGrid className="w-8 h-8 text-white" />
    },
    {
        title: "Minesweeper",
        description: "Clear the board without hitting a mine in this classic logic game.",
        path: "/Minesweeper",
        component: Minesweeper,
        color: "from-red-500 to-orange-500",
        icon: <Bomb className="w-8 h-8 text-white" />
    },
    {
        title: "Flappy Bird",
        description: "Navigate the bird through the pipes. A simple yet addictive game.",
        path: "/FlappyBird",
        component: FlappyBird,
        color: "from-yellow-400 to-orange-500",
        icon: <Ghost className="w-8 h-8 text-white" />
    },
    {
        title: "Forbidden Words",
        description: "Describe the word without saying forbidden terms. A classic party game.",
        path: "/ForbiddenWords/*", // Note the wildcard for routes
        linkPath: "/ForbiddenWords", // For Navigation
        component: ForbiddenWords,
        color: "from-pink-500 to-rose-500",
        icon: <MessageSquare className="w-8 h-8 text-white" />
    },
    {
        title: "Tic-Tac-Toe",
        description: "The classic game. Play Solo, Local PvP, or Online.",
        path: "/TicTacToe/*",
        linkPath: "/TicTacToe",
        component: TicTacToe,
        color: "from-blue-400 to-purple-500",
        icon: <Crown className="w-8 h-8 text-white" />
    },
    {
        title: "Chess",
        description: "Strategize and checkmate your opponent in this timeless classic.",
        path: "/Chess/*",
        linkPath: "/Chess",
        component: Chess,
        color: "from-emerald-500 to-cyan-500",
        icon: <Gamepad2 className="w-8 h-8 text-white" />
    },
    {
        title: "Wordle Helper",
        description: "Master Wordle with smart analysis, solver hints, and a full game mode.",
        path: "/wordle-helper",
        component: WordleHelper,
        color: "from-green-500 to-emerald-600",
        icon: <MessageSquare className="w-8 h-8 text-white" /> 
    },
];

export const ALL_VISUALIZERS = [...ALGORITHMS, ...GAMES];
