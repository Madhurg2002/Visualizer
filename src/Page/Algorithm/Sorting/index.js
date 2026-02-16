
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSort } from './hooks/useSort';
import SortingControls from './SortingControls';
import Confetti from '../../../Components/Confetti' ;

const Sort = () => {
    const {
        size, setSize,
        array, setArray,
        sorting,
        paused,
        activeIndices,
        algorithm, setAlgorithm,
        speed, setSpeed,
        startSort,
        pauseSort,
        reset,
        stepSort,
        isSorted
    } = useSort(50);


    const navigate = useNavigate();
    const maxVal = Math.max(...array, 1); 

    return (

        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#0B0C15] font-sans overflow-x-hidden">
            {isSorted && <Confetti />}
            
            <div className="flex-1 flex flex-col p-6 relative h-full">
                
                <div className="w-full flex flex-col md:flex-row justify-between items-start gap-4 mb-6 z-10">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all w-fit"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>

                    <div className="text-center flex-1 pr-20">
                        <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm mb-1">
                            Sorting Visualizer
                        </h1>
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                            Real-time Algorithm Comparison
                        </p>
                    </div>
                </div>

                <div className="flex justify-center mb-6">
                    <div className="flex gap-6 text-xs font-bold text-slate-400 bg-slate-900/60 px-6 py-2 rounded-full shadow-sm border border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-purple-600 rounded-sm shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
                            <span>Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></div>
                            <span>Unsorted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                            <span>Sorted</span>
                        </div>
                    </div>
                </div>

                <div className="flex-grow relative bg-slate-900/30 rounded-2xl shadow-xl overflow-hidden border border-white/5 flex flex-col backdrop-blur-sm">
                    <div className="absolute inset-0 flex items-end justify-center gap-[1px] sm:gap-[2px] p-6 pb-0">
                        {array.map((val, idx) => {
                            const isActive = activeIndices.includes(idx);
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        height: `${(val / maxVal) * 100}%`,
                                        width: `${100 / size}%`
                                    }}
                                    className={`rounded-t-[2px] transition-all duration-200 ease-in-out ${isActive
                                        ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] z-10'
                                        : 'bg-gradient-to-t from-blue-700 to-blue-500 opacity-90 hover:opacity-100'
                                        }`}
                                ></div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-80 h-auto lg:h-full bg-slate-900/80 backdrop-blur-xl border-t lg:border-l border-white/10 p-6 flex flex-col shadow-2xl z-20">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-2">
                    Configuration
                </div>
                
                <SortingControls
                    algorithm={algorithm}
                    setAlgorithm={setAlgorithm}
                    size={size}
                    setSize={setSize}
                    speed={speed}
                    setSpeed={setSpeed}
                    sorting={sorting}
                    paused={paused}
                    startSort={startSort}
                    pauseSort={pauseSort}
                    resumeSort={startSort}
                    stepSort={stepSort}
                    reset={reset}
                    array={array}
                    setArray={setArray}
                />
            </div>

        </div>
    );
};

export default Sort;
