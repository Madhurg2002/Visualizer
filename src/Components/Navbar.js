import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const navRef = useRef(null);
    const location = useLocation();

    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Smart Navbar Logic
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Always show at top (threshold 10px) to avoid flickering
            if (currentScrollY < 10) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY) {
                // Scrolling DOWN -> Hide
                setIsVisible(false);
            } else {
                // Scrolling UP -> Show
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const menuGroups = {
        algorithms: [
            { name: 'Sorting', path: '/sort' },
            { name: 'Pathfinding', path: '/PathFinding' },
            { name: 'Game of Life', path: '/CellularAutomata' },
        ],
        games: [
            { name: 'Sudoku', path: '/Sudoku' },
            { name: 'Falling Blocks', path: '/FallingBlocks' },
            { name: 'Minesweeper', path: '/Minesweeper' },
            { name: 'Flappy Bird', path: '/FlappyBird' },
            { name: 'Forbidden Words', path: '/ForbiddenWords' },
        ]
    };

    const isPathActive = (path) => location.pathname === path;
    const isGroupActive = (group) => group.some(item => isPathActive(item.path));

    return (
        <motion.nav
            ref={navRef}
            initial={{ y: 0 }}
            animate={{ y: isVisible ? 0 : -100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-4 left-0 right-0 z-50 px-4"
        >
            <div className="max-w-7xl mx-auto">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl px-6 py-3">
                    <div className="flex items-center justify-between">

                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <Link to="/" className="text-2xl font-black tracking-tight text-white flex items-center gap-2 group">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 group-hover:from-pink-400 group-hover:to-indigo-400 transition-all duration-500">
                                    AlgoVisualizer
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden lg:flex items-center gap-8">
                            <Link to="/" className={`text-sm font-bold transition-colors ${isPathActive('/') ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                                Home
                            </Link>

                            {/* Algorithms Dropdown */}
                            <div
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown('algorithms')}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === 'algorithms' ? null : 'algorithms')}
                                    className={`flex items-center gap-1 text-sm font-bold transition-colors ${isGroupActive(menuGroups.algorithms) || activeDropdown === 'algorithms' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                                >
                                    Algorithms <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'algorithms' ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {activeDropdown === 'algorithms' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, x: "-50%" }}
                                            animate={{ opacity: 1, y: 0, x: "-50%" }}
                                            exit={{ opacity: 0, y: 10, x: "-50%" }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 bg-slate-800/90 backdrop-blur border border-white/10 rounded-xl shadow-xl overflow-hidden py-2"
                                        >
                                            {menuGroups.algorithms.map(item => (
                                                <Link
                                                    key={item.path} to={item.path}
                                                    className={`block px-4 py-2 text-sm hover:bg-white/5 ${isPathActive(item.path) ? 'text-blue-400 bg-white/5' : 'text-slate-300'}`}
                                                >
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Games Dropdown */}
                            <div
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown('games')}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === 'games' ? null : 'games')}
                                    className={`flex items-center gap-1 text-sm font-bold transition-colors ${isGroupActive(menuGroups.games) || activeDropdown === 'games' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                                >
                                    Games <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'games' ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {activeDropdown === 'games' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, x: "-50%" }}
                                            animate={{ opacity: 1, y: 0, x: "-50%" }}
                                            exit={{ opacity: 0, y: 10, x: "-50%" }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 bg-slate-800/90 backdrop-blur border border-white/10 rounded-xl shadow-xl overflow-hidden py-2"
                                        >
                                            {menuGroups.games.map(item => (
                                                <Link
                                                    key={item.path} to={item.path}
                                                    className={`block px-4 py-2 text-sm hover:bg-white/5 ${isPathActive(item.path) ? 'text-purple-400 bg-white/5' : 'text-slate-300'}`}
                                                >
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-24 left-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 lg:hidden overflow-y-auto max-h-[80vh]"
                        >
                            <div className="flex flex-col gap-6">
                                <Link to="/" onClick={() => setIsOpen(false)} className="text-xl font-bold text-white">Home</Link>

                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Algorithms</h3>
                                    <div className="flex flex-col gap-2 pl-2">
                                        {menuGroups.algorithms.map(item => (
                                            <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className="py-2 text-slate-300 hover:text-blue-400 block">
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Games</h3>
                                    <div className="flex flex-col gap-2 pl-2">
                                        {menuGroups.games.map(item => (
                                            <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className="py-2 text-slate-300 hover:text-purple-400 block">
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.nav>
    );
};

export default Navbar;
