
import React, { useState } from 'react';
import { useSort } from './hooks/useSort';
import SortingControls from './SortingControls';
import Confetti from '../../../Components/Confetti' ;
import PageHeader, { Pill } from '../../../Components/PageHeader';

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
        isSorted,
        applyCustomArray
    } = useSort(50);

    // Normalize values to [0,1] so custom arrays (negatives, big numbers) render correctly.
    const minVal = Math.min(...array, 0);
    const maxVal = Math.max(...array, minVal + 1); 

    // lg:h-screen gives the row a definite height so the h-full/flex-grow/
    // inset-0 chain below resolves — with only min-h-screen, percentage
    // heights collapse to 0 and the bars never render.
    return (

        <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen w-full bg-[#0B0C15] font-sans overflow-x-hidden">
            {isSorted && <Confetti />}
            
            <div className="flex-1 flex flex-col p-6 relative h-full">
                
                <div className="w-full mb-6 z-10">
                    <PageHeader
                        title="Sorting Visualizer"
                        subtitle={<Pill>Real-time Algorithm Comparison</Pill>}
                    />
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

                <div className="flex-grow relative bg-slate-900/30 rounded-2xl shadow-xl overflow-hidden border border-white/5 flex flex-col backdrop-blur-sm min-h-[420px] lg:min-h-0">
                    <div className="absolute inset-0 flex items-end justify-center gap-[1px] sm:gap-[2px] p-6 pb-0">
                        {array.map((val, idx) => {
                            const isActive = activeIndices.includes(idx);
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        height: `${((val - minVal) / (maxVal - minVal)) * 100}%`,
                                        width: `${100 / size}%`
                                    }}
                                    className={`rounded-t-[2px] transition-all duration-200 ease-in-out ${isActive
                                        ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] z-10'
                                        : isSorted
                                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-90 hover:opacity-100'
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
                    onCustomArray={applyCustomArray}
                />
            </div>

        </div>
    );
};

export default Sort;
