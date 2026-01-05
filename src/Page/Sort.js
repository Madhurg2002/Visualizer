
import React, { useState } from 'react';
import { useSort } from '../Hooks/useSort';
import { ALGORITHM_DESCRIPTIONS } from '../Algorithms/sortingAlgorithms';
import { ALGORITHM_OPTIONS } from '../Algorithms/sortingAlgorithms';
// Icons removed to avoid dependency issues


// Simple icons if heroicons not installed, but using text for now or simple SVG if needed.
// Actually, let's stick to simple text or standard unicode if we want to avoid deps, 
// but I'll use simple inline SVGs for a "Premium" feel.

const Sort = () => {
    const {
        size, setSize,
        array,
        sorting,
        paused,
        activeIndices,
        algorithm, setAlgorithm,
        speed, setSpeed,
        startSort,
        pauseSort,
        reset,
        stepSort
    } = useSort(50);
    
    const [showDesc, setShowDesc] = useState(false);

    const maxVal = Math.max(...array, 1); // Avoid division by zero

    return (
        <div className="flex flex-col items-center justify-center p-6 h-full w-full bg-slate-50">
            {/* Controls Header */}
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300">
                
                {/* Inputs Group */}
                <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
                    <div className="flex flex-col space-y-1 relative"
                         onMouseEnter={() => setShowDesc(true)}
                         onMouseLeave={() => setShowDesc(false)}
                    >
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 cursor-help">
                            Algorithm <span className="text-slate-400 text-[10px]">(Hover for info)</span>
                        </label>
                        <select
                            disabled={sorting}
                            value={algorithm}
                            onChange={(e) => setAlgorithm(e.target.value)}
                            className="bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 outline-none transition-all disabled:opacity-50"
                        >
                            {ALGORITHM_OPTIONS.map((algo) => (
                                <option key={algo} value={algo}>{algo}</option>
                            ))}
                        </select>
                        
                         {/* Description Popover */}
                         {showDesc && (
                            <div className="absolute top-full left-0 mt-2 w-96 z-50 bg-white border-l-4 border-blue-500 p-4 rounded shadow-xl animate-fade-in pointer-events-none">
                                <h3 className="text-lg font-bold text-blue-800 mb-1">{algorithm}</h3>
                                <p className="text-sm text-blue-700 leading-relaxed">
                                    {ALGORITHM_DESCRIPTIONS[algorithm]}
                                </p>
                            </div>
                         )}
                    </div>

                    <div className="flex flex-col space-y-1 w-32">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Size: {size}</label>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            disabled={sorting}
                            value={size}
                            onChange={(e) => setSize(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                        />
                    </div>

                    <div className="flex flex-col space-y-1 w-32">
                         <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Speed: {speed}</label>
                         <input
                            type="range"
                            min="1"
                            max="100"
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                    </div>
                </div>

                {/* Actions Group */}
                <div className="flex items-center gap-3">
                    {!sorting && (
                        <button
                            onClick={startSort}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <span>Start</span>
                        </button>
                    )}
                    
                    {sorting && !paused && (
                         <button
                            onClick={pauseSort}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <span>Pause</span>
                         </button>
                    )}

                    {sorting && paused && (
                        <>
                            <button
                                onClick={startSort}
                                className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <span>Resume</span>
                            </button>
                            <button
                                onClick={stepSort}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <span>Step</span>
                            </button>
                        </>
                    )}

                    <button
                        onClick={reset}
                        disabled={sorting && !paused}
                        className={`flex items-center gap-2 px-4 py-2.5 font-medium rounded-lg shadow-sm border border-slate-200 transition-all duration-200 ${
                            sorting && !paused 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "bg-white text-slate-700 hover:bg-slate-50 hover:text-red-500"
                        }`}
                    >
                         <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* Description */}
            {/* Description - Removed fixed block, moved to hover tooltip */}

            {/* Legend */}
            <div className="flex gap-6 mb-4 text-sm font-medium text-slate-600 bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-sm"></div>
                    <span>Active/Compare</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                    <span>Unsorted</span>
                </div>
                <div className="flex items-center gap-2">
                     <span className="text-xs text-slate-400">Sorted state is implied by order</span>
                </div>
            </div>

            {/* Visualizer Board */}
            <div className="relative w-full max-w-6xl flex-grow bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col" style={{ height: '60vh', minHeight: '400px' }}>
                <div className="flex-1 w-full flex items-end justify-center gap-[1px] sm:gap-[2px] p-4 pb-0">
                    {array.map((val, idx) => {
                         const isActive = activeIndices.includes(idx);
                         return (
                            <div
                                key={idx}
                                style={{
                                    height: `${(val / (Math.max(...array) || 1)) * 100}%`,
                                    width: `${100 / size}%`
                                }}
                                className={`rounded-t-sm transition-all duration-200 ease-in-out ${
                                    isActive 
                                    ? 'bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                                    : 'bg-blue-600 opacity-90 hover:opacity-100'
                                }`}
                            ></div>
                         );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Sort;
