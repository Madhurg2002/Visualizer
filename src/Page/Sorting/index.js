
import React, { useState } from 'react';
import { useSort } from './hooks/useSort';
import SortingControls from './SortingControls';

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
        stepSort
    } = useSort(50);


    const maxVal = Math.max(...array, 1); // Avoid division by zero

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full h-full min-h-screen bg-[#0B0C15]">
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
                resumeSort={startSort} // startSort acts as resume in the hook logic usually, or we can check the hook
                stepSort={stepSort}
                reset={reset}
                array={array}
                setArray={setArray}
            />

            {/* Legend */}
            <div className="flex gap-6 mb-4 text-sm font-medium text-slate-400 bg-slate-900 px-6 py-2 rounded-full shadow-sm border border-white/10">
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
            <div className="relative w-full max-w-6xl flex-grow bg-slate-900/50 rounded-xl shadow-2xl overflow-hidden border border-white/10 flex flex-col" style={{ height: '60vh', minHeight: '400px' }}>
                <div className="flex-1 w-full flex items-end justify-center gap-[1px] sm:gap-[2px] p-4 pb-0">
                    {array.map((val, idx) => {
                        const isActive = activeIndices.includes(idx);
                        return (
                            <div
                                key={idx}
                                style={{
                                    height: `${(val / maxVal) * 100}%`,
                                    width: `${100 / size}%`
                                }}
                                className={`rounded-t-sm transition-all duration-200 ease-in-out ${isActive
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
