
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    const visualizers = [
        {
            title: "Sorting Visualizer",
            description: "Watch how Bubble, Merge, Quick, and other sorting algorithms work in real-time.",
            path: "/sort",
            color: "from-blue-500 to-cyan-400",
            icon: (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
            )
        },
        {
            title: "Pathfinding Visualizer",
            description: "Visualize Dijkstra, A*, and DFS finding the shortest path through a maze.",
            path: "/PathFinding",
            color: "from-purple-500 to-pink-500",
            icon: (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            )
        },
        // We can add other cards here even if their functionality is basic
        {
            title: "Sudoku Solver",
            description: "Visualize the backtracking algorithm solving a Sudoku puzzle instantly.",
            path: "/Sudoku",
            color: "from-amber-500 to-orange-400",
             icon: (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            title: "Game of Life",
            description: "Interact with Conway's Cellular Automata. Create life, watch it evolve, or die out.",
            path: "/CellularAutomata",
            color: "from-green-400 to-emerald-600",
            icon: (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            title: "Tetris Game",
            description: "Play the classic block-stacking game. Fully interactive with score tracking.",
            path: "/Tetris",
            color: "from-indigo-500 to-violet-500",
            icon: (
                 <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )
        }
    ];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-3xl mb-16 space-y-4">
                <h1 className="text-6xl font-black text-slate-900 tracking-tight">
                    Algorithm <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Visualizer</span>
                </h1>
                <p className="text-2xl text-slate-600 font-light max-w-2xl mx-auto">
                    Explore, visualize, and master classic algorithms with interactive demonstrations.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
                {visualizers.map((item) => (
                    <Link 
                        to={item.path} 
                        key={item.title}
                        className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ring-1 ring-slate-100"
                    >
                        {item.badged && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 shadow-sm">
                                NEW
                            </div>
                        )}
                        <div className={`h-24 bg-gradient-to-r ${item.color} flex items-center justify-center`}>
                           {item.icon}
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-slate-500">
                                {item.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Home;
