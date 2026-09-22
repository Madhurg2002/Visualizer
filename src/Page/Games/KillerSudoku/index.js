import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    randomSeed,
    generateKillerPuzzle,
    buildCageIdOf,
    cageViolated,
    killerCandidates,
    isValid,
    isComplete,
} from "./utils";
import { THEMES } from "../Sudoku/themes";
import Settings from "../Sudoku/Settings";
import WinningModal from "../Sudoku/WinningModal";
import { SettingsIcon } from "../Sudoku/Icons";
import Confetti from "../../../Components/Confetti";
import PageHeader, { Pill } from "../../../Components/PageHeader";
import KillerBoard from "./KillerBoard";
import Controls from "./Controls";
import NumberSelector from "./NumberSelector";
import RulesPanel from "./RulesPanel";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Timer = ({ isRunning, theme, themeColors, onTimeUpdate }) => {
    const [time, setTime] = useState(0);

    useEffect(() => {
        if (!isRunning) return;
        const t = setInterval(() => {
            setTime((prev) => {
                const next = prev + 1;
                if (onTimeUpdate) onTimeUpdate.current = next;
                return next;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [isRunning, onTimeUpdate]);

    useEffect(() => {
        if (isRunning) {
            setTime(0);
            if (onTimeUpdate) onTimeUpdate.current = 0;
        }
    }, [isRunning, onTimeUpdate]);

    return (
        <div
            style={{
                backgroundColor: theme === "light" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(6px)",
                padding: "8px 20px",
                borderRadius: 12,
                boxShadow: theme === "light" ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "0 4px 12px rgba(0, 0, 0, 0.7)",
                fontFamily: "'Courier New', Courier, monospace",
                fontWeight: 700,
                fontSize: "1.3rem",
                color: themeColors.boardBorder,
                userSelect: "none",
                minWidth: 90,
                textAlign: "center",
                marginBottom: 12,
                border: theme === "light" ? "1px solid rgba(0, 0, 0, 0.1)" : "1px solid rgba(255, 255, 255, 0.15)",
            }}
            role="timer"
            aria-live="polite"
            aria-label="Elapsed time"
            title="Elapsed time"
        >
            {new Date(time * 1000).toISOString().substr(14, 5)}
        </div>
    );
};

const DEFAULT_STATS = {
    easy: { won: 0, bestTime: null },
    medium: { won: 0, bestTime: null },
    hard: { won: 0, bestTime: null },
    extreme: { won: 0, bestTime: null },
};

export default function KillerSudoku() {
    const navigate = useNavigate();
    const query = useMemo(() => new URLSearchParams(window.location.search), []);

    const urlSeed = query.get("seed") || "";
    const urlDiff = query.get("difficulty") || "easy";
    const urlTheme = query.get("theme") || "dark";
    const urlRules = query.get("rules") === "1";

    const initialSeed = useMemo(() => urlSeed || randomSeed(), [urlSeed]);

    const [difficulty, setDifficulty] = useState(urlDiff);
    const [seedInput, setSeedInput] = useState(initialSeed);
    const [seed, setSeed] = useState(initialSeed);
    const [theme, setTheme] = useState(urlTheme);

    const [settingsVisible, setSettingsVisible] = useState(false);
    const [rulesOpen, setRulesOpen] = useState(urlRules);

    const [continuousCheck, setContinuousCheck] = useState(() => {
        const val = query.get("continuousCheck");
        return val !== null ? val === "true" : false;
    });
    const [highlightNumbers, setHighlightNumbers] = useState(() => {
        const val = query.get("highlightNumbers");
        return val !== null ? val === "true" : true;
    });
    const [highlightGuides, setHighlightGuides] = useState(() => {
        const val = query.get("highlightGuides");
        return val !== null ? val === "true" : false;
    });
    const [autoRemoveNotes, setAutoRemoveNotes] = useState(() => {
        const val = query.get("autoRemoveNotes");
        if (val !== null) return val === "true";
        const saved = localStorage.getItem("killerAutoRemoveNotes");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [showNotes, setShowNotes] = useState(() => {
        const val = query.get("showNotes");
        if (val !== null) return val === "true";
        const saved = localStorage.getItem("killerShowNotes");
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem("killerAutoRemoveNotes", JSON.stringify(autoRemoveNotes));
    }, [autoRemoveNotes]);

    useEffect(() => {
        localStorage.setItem("killerShowNotes", JSON.stringify(showNotes));
    }, [showNotes]);

    // Shareable URL, same convention as the classic page.
    useEffect(() => {
        const params = new URLSearchParams();
        if (seed) params.set("seed", seed);
        if (difficulty && difficulty !== "easy") params.set("difficulty", difficulty);
        if (theme && theme !== "dark") params.set("theme", theme);
        if (continuousCheck) params.set("continuousCheck", true);
        if (!highlightNumbers) params.set("highlightNumbers", false);
        if (highlightGuides) params.set("highlightGuides", true);
        if (!autoRemoveNotes) params.set("autoRemoveNotes", false);
        if (!showNotes) params.set("showNotes", false);
        const queryString = params.toString();
        navigate(queryString ? `?${queryString}` : window.location.pathname, { replace: true });
    }, [seed, difficulty, theme, continuousCheck, highlightNumbers, highlightGuides, autoRemoveNotes, showNotes, navigate]);

    const themeColors = THEMES[theme];

    const [notes, setNotes] = useState({});
    const [isNoteMode, setIsNoteMode] = useState(false);
    const [board, setBoard] = useState([]);
    const [solution, setSolution] = useState([]);
    const [cages, setCages] = useState([]);
    const [cageIdOf, setCageIdOf] = useState(null);
    const [givenCells, setGivenCells] = useState(new Set());
    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [manualCheckResult, setManualCheckResult] = useState(null);
    const [hintCell, setHintCell] = useState(null);
    const [errorCell, setErrorCell] = useState(null);
    const userEditedAfterHint = useRef(false);
    const [history, setHistory] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
    const [win, setWin] = useState(false);
    const [solving, setSolving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(true);
    const solvingRef = useRef(false);
    const [poppedButton, setPoppedButton] = useState(null);

    const timeElapsedRef = useRef(0);
    const [highlightValue, setHighlightValue] = useState(null);

    const [statistics, setStatistics] = useState(() => {
        const saved = localStorage.getItem("killerSudokuStats");
        if (saved) {
            try {
                return { ...DEFAULT_STATS, ...JSON.parse(saved) };
            } catch {
                return { ...DEFAULT_STATS };
            }
        }
        return { ...DEFAULT_STATS };
    });
    const hasUsedSolver = useRef(false);

    useEffect(() => {
        document.body.style.backgroundColor = themeColors.bg;
        return () => {
            document.body.style.backgroundColor = "";
        };
    }, [themeColors.bg]);

    // Generate puzzle: solution + cages from the seed; uniqueness guaranteed by the engine.
    useEffect(() => {
        setIsGenerating(true);

        const t = setTimeout(() => {
            const { cages: newCages, solution: newSolution, givens } = generateKillerPuzzle(seed, difficulty);
            const empty = Array.from({ length: 9 }, () => Array(9).fill(0));

            setBoard(empty);
            setSolution(newSolution);
            setCages(newCages);
            setCageIdOf(buildCageIdOf(newCages));
            setGivenCells(givens);
            setSelectedCell(null);
            setSelectedNumber(null);
            setHighlightValue(null);
            setManualCheckResult(null);
            setHintCell(null);
            setErrorCell(null);
            setWin(false);
            setNotes({});
            userEditedAfterHint.current = false;
            setHistory([{ board: empty, notes: {} }]);
            setIsDirty(false);
            hasUsedSolver.current = false;
            setIsGenerating(false);
        }, 10);

        return () => clearTimeout(t);
    }, [seed, difficulty]);

    const handleApplySeed = () => {
        if (seedInput.trim() && seedInput !== seed) setSeed(seedInput.trim());
    };

    useEffect(() => {
        if (win) {
            if (!hasUsedSolver.current) {
                setStatistics((prev) => {
                    const diffStats = prev[difficulty] || { won: 0, bestTime: null };
                    const newWon = diffStats.won + 1;
                    const finalTime = timeElapsedRef.current;
                    const newBest = diffStats.bestTime === null ? finalTime : Math.min(diffStats.bestTime, finalTime);
                    const newStats = { ...prev, [difficulty]: { won: newWon, bestTime: newBest } };
                    localStorage.setItem("killerSudokuStats", JSON.stringify(newStats));
                    return newStats;
                });
            }
        }
    }, [win, difficulty]);

    const boardRef = useRef(null);
    const numberSelectorRef = useRef(null);
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                boardRef.current && !boardRef.current.contains(event.target) &&
                numberSelectorRef.current && !numberSelectorRef.current.contains(event.target)
            ) {
                setSelectedCell(null);
                if (selectedNumber === null) setHighlightValue(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedNumber]);

    useEffect(() => {
        if (!highlightNumbers) {
            setHighlightValue(null);
            return;
        }
        if (selectedNumber !== null) {
            setHighlightValue(selectedNumber);
        } else if (selectedCell && board[selectedCell[0]] && board[selectedCell[0]][selectedCell[1]] !== 0) {
            setHighlightValue(board[selectedCell[0]][selectedCell[1]]);
        } else {
            setHighlightValue(null);
        }
    }, [highlightNumbers, selectedNumber, selectedCell, board]);

    const undo = () => {
        setHistory((prev) => {
            if (prev.length <= 1) return prev;
            const newHist = prev.slice(0, prev.length - 1);
            const prevState = newHist[newHist.length - 1];
            setBoard(prevState.board);
            setNotes(prevState.notes || {});
            setManualCheckResult(null);
            userEditedAfterHint.current = true;
            setHintCell(null);
            setErrorCell(null);
            setSelectedCell(null);
            setHighlightValue(null);
            return newHist;
        });
    };

    const toggleNote = useCallback((r, c, num) => {
        const key = `${r}-${c}`;
        setNotes((prev) => {
            const newNotes = { ...prev };
            const cellNotes = new Set(newNotes[key] || []);
            if (cellNotes.has(num)) cellNotes.delete(num);
            else cellNotes.add(num);
            if (cellNotes.size === 0) delete newNotes[key];
            else newNotes[key] = cellNotes;

            setHistory((prevHist) => {
                const currentBoard = prevHist[prevHist.length - 1].board;
                return [...prevHist, { board: currentBoard, notes: newNotes }];
            });
            return newNotes;
        });
    }, []);

    const fillCell = useCallback((r, c, num) => {
        if (givenCells.has(`${r}-${c}`)) return;

        let newNotes = { ...notes };
        if (autoRemoveNotes && num !== 0) {
            const startR = Math.floor(r / 3) * 3;
            const startC = Math.floor(c / 3) * 3;
            for (let i = 0; i < 9; i++) {
                const rKey = `${r}-${i}`;
                const cKey = `${i}-${c}`;
                const bR = startR + Math.floor(i / 3);
                const bC = startC + (i % 3);
                const bKey = `${bR}-${bC}`;

                [rKey, cKey, bKey].forEach((key) => {
                    if (newNotes[key] && newNotes[key].has(num)) {
                        const cellNotes = new Set(newNotes[key]);
                        cellNotes.delete(num);
                        if (cellNotes.size === 0) delete newNotes[key];
                        else newNotes[key] = cellNotes;
                    }
                });
            }
        }
        delete newNotes[`${r}-${c}`];

        setNotes(newNotes);

        const newBoard = board.map((row) => row.slice());
        newBoard[r][c] = num;
        setBoard(newBoard);
        setIsDirty(true);

        setHistory((prev) => [...prev, { board: newBoard, notes: newNotes }]);
        setManualCheckResult(null);
        if (hintCell !== null || errorCell !== null) {
            userEditedAfterHint.current = true;
            setHintCell(null);
            setErrorCell(null);
        }
        if (solution.length && isComplete(newBoard, solution)) setWin(true);
    }, [board, givenCells, hintCell, solution, notes, autoRemoveNotes]);

    // Cells whose digit violates its cage (duplicate in cage / sum overflow / wrong total).
    const cageWrongCells = useMemo(() => {
        if (!continuousCheck || !cages.length || !cageIdOf) return new Set();
        const wrong = new Set();
        board.forEach((row, r) => row.forEach((val, c) => {
            if (val !== 0 && cageViolated(board, cages, cageIdOf, r, c, val)) wrong.add(`${r}-${c}`);
        }));
        return wrong;
    }, [board, cages, cageIdOf, continuousCheck]);

    const isWrong = useMemo(() => {
        if (!continuousCheck || !solution.length) return new Set();
        const wrongs = new Set();
        board.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val !== 0 && val !== solution[r][c]) wrongs.add(`${r}-${c}`);
            });
        });
        return wrongs;
    }, [board, solution, continuousCheck]);

    const handleErase = useCallback(() => {
        if (selectedCell && !givenCells.has(`${selectedCell[0]}-${selectedCell[1]}`)) {
            fillCell(selectedCell[0], selectedCell[1], 0);
        }
    }, [selectedCell, givenCells, fillCell]);

    const handleCellClick = useCallback((r, c) => {
        if (selectedNumber !== null) {
            if (selectedNumber === "erase") {
                if (!givenCells.has(`${r}-${c}`)) fillCell(r, c, 0);
            } else {
                if (board[r][c] === 0) {
                    if (isNoteMode) toggleNote(r, c, selectedNumber);
                    else fillCell(r, c, selectedNumber);
                } else if (!givenCells.has(`${r}-${c}`)) {
                    if (!isNoteMode) fillCell(r, c, selectedNumber);
                }
            }
            setSelectedCell(null);
            return;
        }
        setSelectedCell([r, c]);
    }, [board, selectedNumber, isNoteMode, toggleNote, fillCell, givenCells]);

    const handleNumberSelect = (num) => {
        if (selectedNumber === num) {
            setSelectedNumber(null);
        } else {
            if (selectedCell && !givenCells.has(`${selectedCell[0]}-${selectedCell[1]}`)) {
                const [r, c] = selectedCell;
                if (num === "erase") {
                    fillCell(r, c, 0);
                } else if (board[r][c] === 0) {
                    if (isNoteMode) toggleNote(r, c, num);
                    else fillCell(r, c, num);
                } else {
                    if (!isNoteMode) fillCell(r, c, num);
                }
                setSelectedNumber(null);
            } else {
                setSelectedNumber(num);
                setSelectedCell(null);
            }
        }
    };

    const onManualCheck = () => {
        for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++) {
                if (board[r][c] !== 0 && board[r][c] !== solution[r][c]) {
                    setManualCheckResult(false);
                    return;
                }
            }
        setManualCheckResult(true);
    };

    const hintTimeoutRef = useRef(null);
    const errorTimeoutRef = useRef(null);

    const showHint = () => {
        // 1. Flag mistakes first.
        const mistakes = [];
        board.forEach((row, r) =>
            row.forEach((val, c) => {
                if (val !== 0 && solution.length && val !== solution[r][c]) mistakes.push([r, c]);
            })
        );

        if (mistakes.length > 0) {
            const idx = Math.floor(Math.random() * mistakes.length);
            const [r, c] = mistakes[idx];
            setErrorCell(`${r}-${c}`);
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(() => setErrorCell(null), 3000);
            return;
        }

        // 2. Reveal a random empty cell.
        const emptyCells = [];
        board.forEach((row, r) => row.forEach((val, c) => { if (val === 0) emptyCells.push([r, c]); }));
        if (!emptyCells.length) return;
        const idx = Math.floor(Math.random() * emptyCells.length);
        const [r, c] = emptyCells[idx];

        fillCell(r, c, solution[r][c]);
        setHintCell(`${r}-${c}`);
        userEditedAfterHint.current = false;

        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = setTimeout(() => setHintCell(null), 3000);
    };

    const autoFillNotes = () => {
        if (!cages.length || !cageIdOf) return;
        const newNotes = { ...notes };
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    const validNums = new Set(killerCandidates(board, cages, cageIdOf, r, c));
                    if (validNums.size > 0) newNotes[`${r}-${c}`] = validNums;
                    else delete newNotes[`${r}-${c}`];
                }
            }
        }
        setNotes(newNotes);
        setHistory((prev) => [...prev, { board, notes: newNotes }]);
    };

    const visualizeSolver = async () => {
        if (solvingRef.current || win || !cages.length) return;
        setSolving(true);
        solvingRef.current = true;
        hasUsedSolver.current = true;

        const currentBoard = board.map((row) => row.slice());

        const killerValid = (b, r, c, n) =>
            isValid(b, r, c, n) && !cageViolated(b, cages, cageIdOf, r, c, n);

        const solve = async () => {
            if (!solvingRef.current) return false;
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (currentBoard[r][c] === 0) {
                        for (let n = 1; n <= 9; n++) {
                            if (!solvingRef.current) return false;
                            if (killerValid(currentBoard, r, c, n)) {
                                currentBoard[r][c] = n;
                                setBoard(currentBoard.map((row) => row.slice()));
                                setSelectedCell([r, c]);
                                await sleep(20);
                                if (await solve()) return true;
                                currentBoard[r][c] = 0;
                                setBoard(currentBoard.map((row) => row.slice()));
                                await sleep(5);
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        };

        await solve();

        if (solution.length && isComplete(currentBoard, solution)) setWin(true);
        setSolving(false);
        solvingRef.current = false;
        setSelectedCell(null);
    };

    useEffect(() => {
        const handleKey = (e) => {
            if (!selectedCell || win) return;
            const [r, c] = selectedCell;
            if (givenCells.has(`${r}-${c}`)) return;

            if (e.key === "n" || e.key === "N") {
                setIsNoteMode((prev) => !prev);
                return;
            }

            if (/^[1-9]$/.test(e.key)) {
                const num = Number(e.key);
                if (isNoteMode && board[r][c] === 0) toggleNote(r, c, num);
                else fillCell(r, c, num);
            } else if (e.key === "Backspace" || e.key === "Delete") {
                fillCell(r, c, 0);
            } else if (e.key === "ArrowUp" && r > 0) setSelectedCell([r - 1, c]);
            else if (e.key === "ArrowDown" && r < 8) setSelectedCell([r + 1, c]);
            else if (e.key === "ArrowLeft" && c > 0) setSelectedCell([r, c - 1]);
            else if (e.key === "ArrowRight" && c < 8) setSelectedCell([r, c + 1]);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [selectedCell, win, board, givenCells, fillCell, isNoteMode, toggleNote]);

    const handleButtonClick = useCallback((btnName, cb) => {
        setPoppedButton(btnName);
        cb();
        setTimeout(() => setPoppedButton(null), 150);
    }, []);

    return (
        <div className="flex flex-col items-center w-full min-h-screen bg-[#0B0C15] font-sans pb-8">
            {win && <Confetti />}
            {win && (
                <WinningModal
                    onClose={() => setWin(false)}
                    onNewGame={() => {
                        const newSeed = randomSeed();
                        setSeed(newSeed);
                        setSeedInput(newSeed);
                        setWin(false);
                    }}
                    timeElapsed={timeElapsedRef.current}
                    stats={statistics[difficulty]}
                    hasUsedSolver={hasUsedSolver.current}
                    theme={theme}
                    themeColors={themeColors}
                />
            )}
            {manualCheckResult !== null && (
                <div
                    style={{
                        position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)",
                        backgroundColor: manualCheckResult ? "#22c55e" : "#ef4444",
                        color: "#fff", padding: "10px 20px", borderRadius: 8, zIndex: 2000,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)", fontWeight: "bold",
                    }}
                    onClick={() => setManualCheckResult(null)}
                >
                    {manualCheckResult ? "Correct so far!" : "Mistakes found!"}
                </div>
            )}
            <Settings
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
                continuousCheck={continuousCheck}
                setContinuousCheck={setContinuousCheck}
                theme={theme}
                setTheme={setTheme}
                highlightNumbers={highlightNumbers}
                setHighlightNumbers={setHighlightNumbers}
                highlightGuides={highlightGuides}
                setHighlightGuides={setHighlightGuides}
                autoRemoveNotes={autoRemoveNotes}
                setAutoRemoveNotes={setAutoRemoveNotes}
                showNotes={showNotes}
                setShowNotes={setShowNotes}
                onAutoFillNotes={() => {
                    autoFillNotes();
                    setSettingsVisible(false);
                }}
            />

            {/* Header */}
            <div className="w-full max-w-4xl px-4 pt-4 pb-1 mb-2">
                <PageHeader
                    title="Killer Sudoku"
                    accent="from-cyan-400 via-sky-400 to-blue-500"
                    subtitle={
                        <>
                            <Pill>{difficulty}</Pill>
                            {cages.length > 0 && <Pill className="!text-cyan-400">{cages.length} cages</Pill>}
                            {givenCells.size > 0 && <Pill>{givenCells.size} givens</Pill>}
                        </>
                    }
                    right={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setRulesOpen(true)}
                                className="flex items-center justify-center p-3 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all"
                                title="Show Killer Sudoku rules"
                            >
                                ?
                            </button>
                            <button
                                onClick={() => setSettingsVisible(true)}
                                className="flex items-center justify-center p-3 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all shadow-lg"
                                title="Open game settings"
                            >
                                <SettingsIcon size={20} />
                            </button>
                        </div>
                    }
                />
            </div>

            {rulesOpen && (
                <RulesPanel forceOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
            )}

            <Controls
                difficulty={difficulty}
                seedInput={seedInput}
                setSeedInput={setSeedInput}
                currentSeed={seed}
                onApplySeed={handleApplySeed}
                onRandomize={() => {
                    if (isDirty) {
                        if (!window.confirm("You have made progress. Are you sure you want to randomize? Your current board will be lost.")) {
                            return;
                        }
                    }
                    const newSeed = randomSeed();
                    setSeed(newSeed);
                    setSeedInput(newSeed);
                }}
                onDifficultyChange={() => {
                    const levels = ["easy", "medium", "hard", "extreme"];
                    const nextIndex = (levels.indexOf(difficulty) + 1) % levels.length;
                    const nextDiff = levels[nextIndex];
                    if (isDirty) {
                        if (window.confirm("You have made progress on this puzzle. Are you sure you want to change the difficulty? Your progress will be lost.")) {
                            setDifficulty(nextDiff);
                        }
                    } else {
                        setDifficulty(nextDiff);
                    }
                }}
                onUndo={undo}
                undoDisabled={history.length <= 1}
                onCheck={onManualCheck}
                checkDisabled={continuousCheck}
                onHint={showHint}
                onVisualizeSolver={visualizeSolver}
                solving={solving}
                isNoteMode={isNoteMode}
                onToggleNoteMode={() => setIsNoteMode((prev) => !prev)}
                poppedButton={poppedButton}
                handleButtonClick={handleButtonClick}
                theme={theme}
                themeColors={themeColors}
            />

            <Timer
                isRunning={!win && !isGenerating}
                theme={theme}
                themeColors={themeColors}
                onTimeUpdate={timeElapsedRef}
            />

            <div ref={boardRef} className="relative w-full max-w-[500px] px-4 md:px-0">
                {board.length > 0 && cageIdOf && (
                    <KillerBoard
                        board={board}
                        givens={givenCells}
                        isWrong={isWrong}
                        hintCell={hintCell}
                        errorCell={errorCell}
                        userEditedAfterHint={userEditedAfterHint}
                        selected={selectedCell}
                        onCellClick={handleCellClick}
                        win={win}
                        themeColors={themeColors}
                        theme={theme}
                        highlightValue={highlightValue}
                        highlightGuides={highlightGuides}
                        notes={showNotes ? notes : {}}
                        cages={cages}
                        cageIdOf={cageIdOf}
                        cageWrongCells={cageWrongCells}
                    />
                )}
                {isGenerating && (
                    <div
                        className="absolute inset-0 flex flex-col justify-center items-center z-50 backdrop-blur-sm rounded-xl"
                        style={{ backgroundColor: theme === "dark" ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.5)" }}
                    >
                        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                        <div className="mt-4 font-bold tracking-widest text-cyan-500 uppercase text-sm animate-pulse">
                            Growing cages…
                        </div>
                    </div>
                )}
            </div>

            <div ref={numberSelectorRef} className="w-full flex justify-center">
                <NumberSelector
                    selected={selectedNumber}
                    setSelected={handleNumberSelect}
                    onErase={handleErase}
                    themeColors={themeColors}
                    board={board}
                    solution={solution}
                />
            </div>

            <style>{`
                @keyframes hintBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>{" "}
        </div>
    );
}
