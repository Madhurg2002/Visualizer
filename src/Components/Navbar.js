
import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const Navbar = () => {
    const navItems = [
        { name: 'Sorting', path: '/sort' },
        { name: 'Pathfinding', path: '/PathFinding' },
        { name: 'Sudoku', path: '/Sudoku' },
        { name: 'Game of Life', path: '/CellularAutomata' },
        { name: 'Tetris', path: '/Tetris' },
        { name: 'Minesweeper', path: '/Minesweeper' },
    ];

    return (
        <nav className="bg-slate-900 text-white shadow-lg z-50 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                                AlgoVisualizer
                            </Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                                isActive
                                                    ? 'bg-slate-800 text-white shadow-inner'
                                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                            }`
                                        }
                                    >
                                        {item.name}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
