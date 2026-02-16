
import React, { useState } from 'react';
import { ALGORITHM_OPTIONS, ALGORITHM_DESCRIPTIONS } from './utils/sortingAlgorithms';
import Button from '../../../Components/Button';
import { Play, Pause, RotateCcw, SkipForward, Check } from 'lucide-react';

const SortingControls = ({
    algorithm, setAlgorithm,
    size, setSize,
    speed, setSpeed,
    sorting, paused,
    startSort, pauseSort, resumeSort, stepSort, reset,
    array, setArray
}) => {
    const [showDesc, setShowDesc] = useState(false);
    const [customInput, setCustomInput] = useState("");

    const handleCustomArray = () => {
        const nums = customInput.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n));

        if (nums.length > 0) {
            setArray(nums);
            setSize(nums.length);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Inputs Group */}
            <div className="flex flex-col gap-5 w-full">
                
                {/* Algorithm Select */}
                <div className="flex flex-col space-y-2 relative"
                    onMouseEnter={() => setShowDesc(true)}
                    onMouseLeave={() => setShowDesc(false)}
                >
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 cursor-help">
                        Algorithm <span className="text-slate-600 text-[10px] ml-auto bg-slate-800 px-1.5 py-0.5 rounded">?</span>
                    </label>
                    <select
                        disabled={sorting}
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value)}
                        className="bg-slate-800 border border-white/10 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none transition-all disabled:opacity-50 cursor-pointer hover:bg-slate-700"
                    >
                        {ALGORITHM_OPTIONS.map((algo) => (
                            <option key={algo} value={algo}>{algo}</option>
                        ))}
                    </select>

                    {/* Description Popover - Positioned to left/bottom of sidebar */}
                    {showDesc && (
                        <div className="absolute right-full top-0 mr-4 w-72 z-50 bg-slate-800 border-l-4 border-blue-500 p-4 rounded shadow-2xl animate-fade-in pointer-events-none border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-2">{algorithm}</h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {ALGORITHM_DESCRIPTIONS[algorithm]}
                            </p>
                        </div>
                    )}
                </div>

                {/* Size Slider */}
                <div className="flex flex-col space-y-2 w-full">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Size</span>
                        <span className="text-slate-300">{size}</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        disabled={sorting}
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                    />
                </div>

                {/* Speed Slider */}
                <div className="flex flex-col space-y-2 w-full">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Speed</span>
                        <span className="text-slate-300">{speed}ms</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10 w-full my-2"></div>

            {/* Custom Input */}
            <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custom Array</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="10, 5, 8..."
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-white/10 text-white rounded-lg placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        disabled={sorting}
                    />
                    <Button
                        onClick={handleCustomArray}
                        disabled={sorting}
                        size="sm"
                        variant="secondary"
                        className="whitespace-nowrap"
                    >
                        Set
                    </Button>
                </div>
            </div>

             {/* Divider */}
            <div className="h-px bg-white/10 w-full my-2"></div>

            {/* Actions Group (Vertical Stack) */}
            <div className="flex flex-col gap-3 mt-auto">
                {!sorting && (
                    <Button
                        onClick={startSort}
                        icon={Play}
                        variant="primary"
                        className="w-full justify-center py-3 text-base shadow-lg shadow-blue-500/20"
                    >
                        Start Sorting
                    </Button>
                )}

                {sorting && !paused && (
                    <Button
                        onClick={pauseSort}
                        icon={Pause}
                        variant="primary"
                        className="w-full justify-center py-3 bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 text-white shadow-lg shadow-amber-500/20"
                    >
                        Pause
                    </Button>
                )}

                {sorting && paused && (
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={resumeSort}
                            icon={Play}
                            variant="success"
                            className="justify-center"
                        >
                            Resume
                        </Button>
                        <Button
                            onClick={stepSort}
                            icon={SkipForward}
                            variant="secondary"
                            className="justify-center"
                        >
                            Step
                        </Button>
                    </div>
                )}

                <Button
                    onClick={reset}
                    disabled={sorting && !paused}
                    variant="secondary"
                    icon={RotateCcw}
                    className={`w-full justify-center ${sorting && !paused ? "opacity-50" : "hover:text-red-400 hover:border-red-500/30"}`}
                >
                    Reset Visualizer
                </Button>
            </div>
        </div>
    );
};

export default SortingControls;
