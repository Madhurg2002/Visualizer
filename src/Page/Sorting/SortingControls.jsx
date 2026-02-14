
import React, { useState } from 'react';
import { ALGORITHM_OPTIONS, ALGORITHM_DESCRIPTIONS } from './utils/sortingAlgorithms';
import Button from '../../Components/Button';
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
        <div className="w-full max-w-6xl bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300">
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
                        className="bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 outline-none transition-all disabled:opacity-50 cursor-pointer"
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

            {/* Custom Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="e.g. 10, 5, 8, 20"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm w-48 bg-slate-800 border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 transition-all"
                    disabled={sorting}
                />
                <Button
                    onClick={handleCustomArray}
                    disabled={sorting}
                    size="sm"
                    variant="secondary"
                >
                    Set
                </Button>
            </div>

            {/* Actions Group */}
            <div className="flex items-center gap-3">
                {!sorting && (
                    <Button
                        onClick={startSort}
                        icon={Play}
                        variant="primary"
                    >
                        Start
                    </Button>
                )}

                {sorting && !paused && (
                    <Button
                        onClick={pauseSort}
                        icon={Pause}
                        variant="primary"
                        className="bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
                    >
                        Pause
                    </Button>
                )}

                {sorting && paused && (
                    <>
                        <Button
                            onClick={resumeSort}
                            icon={Play}
                            variant="success"
                        >
                            Resume
                        </Button>
                        <Button
                            onClick={stepSort}
                            icon={SkipForward}
                            variant="secondary"
                        >
                            Step
                        </Button>
                    </>
                )}

                <Button
                    onClick={reset}
                    disabled={sorting && !paused}
                    variant="secondary"
                    icon={RotateCcw}
                    className={sorting && !paused ? "opacity-50 cursor-not-allowed" : "hover:text-red-400 hover:border-red-400/30"}
                >
                    Reset
                </Button>
            </div>
        </div>
    );
};

export default SortingControls;
