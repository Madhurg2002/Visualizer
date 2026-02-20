import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react'; // Added import
import {
  randomSeed,
  generateFull,
  puzzleFromFull,
  isComplete,
  DIFFICULTY,

  isValid,
} from "./utils";
import SudokuBoard from "./SudokuBoard";
import Controls from "./Controls";

import WinningModal from "./WinningModal";
import NumberSelector from "./NumberSelector";
import Settings from "./Settings";
import { THEMES } from "./themes";

import { SettingsIcon } from "./Icons";
import Confetti from "../../../Components/Confetti";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Sudoku() {
  const navigate = useNavigate();
  const query = new URLSearchParams(window.location.search);

  const urlSeed = query.get("seed") || "";
  const urlDiff = query.get("difficulty") || "easy";

  const urlTheme = query.get("theme") || "dark";

  // If urlSeed exists, use it. Otherwise use the initial random seed.
  const initialSeed = useMemo(() => urlSeed || randomSeed(), [urlSeed]);

  const [difficulty, setDifficulty] = useState(urlDiff);
  const [seedInput, setSeedInput] = useState(initialSeed);
  const [seed, setSeed] = useState(initialSeed);

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [theme, setTheme] = useState(urlTheme);


  useEffect(() => {
    const params = new URLSearchParams();
    if (seed) params.set("seed", seed);
    if (difficulty) params.set("difficulty", difficulty);
    if (theme) params.set("theme", theme);
    navigate(`?${params.toString()}`, { replace: true });
  }, [seed, difficulty, theme, navigate]);
  const clues = DIFFICULTY[difficulty];

  const themeColors = THEMES[theme];
  const [continuousCheck, setContinuousCheck] = useState(false);
  const [highlightNumbers, setHighlightNumbers] = useState(true);
  const [highlightGuides, setHighlightGuides] = useState(false);


  const [notes, setNotes] = useState({});
  const [isNoteMode, setIsNoteMode] = useState(false);
  
  const [autoRemoveNotes, setAutoRemoveNotes] = useState(() => {
    const saved = localStorage.getItem("sudokuAutoRemoveNotes");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("sudokuAutoRemoveNotes", JSON.stringify(autoRemoveNotes));
  }, [autoRemoveNotes]);

  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [lockedCells, setLockedCells] = useState(new Set());
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [manualCheckResult, setManualCheckResult] = useState(null);
  const [hintCell, setHintCell] = useState(null);
  const userEditedAfterHint = useRef(false);
  const [history, setHistory] = useState([]);
  const [win, setWin] = useState(false);
  const [solving, setSolving] = useState(false);
  const solvingRef = useRef(false);
  const [poppedButton, setPoppedButton] = useState(null); // Timer state

  const [timeElapsed, setTimeElapsed] = useState(0); // This drives cell highlighting!

  const [highlightValue, setHighlightValue] = useState(null); // Theme background

  const [statistics, setStatistics] = useState(() => {
    const saved = localStorage.getItem("sudokuStats");
    return saved ? JSON.parse(saved) : {
      easy: { won: 0, bestTime: null },
      medium: { won: 0, bestTime: null },
      hard: { won: 0, bestTime: null }
    };
  });
  const hasUsedSolver = useRef(false);

  useEffect(() => {
    document.body.style.backgroundColor = themeColors.bg;
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [themeColors.bg]);

  useEffect(() => {
    if (urlSeed !== seed) navigate(`?seed=${seed}`, { replace: true });
    const full = generateFull(seed);
    const puzzle = puzzleFromFull(full, clues, seed + difficulty);
    setBoard(puzzle);
    setSolution(full);
    setSelectedCell(null);
    setSelectedNumber(null);
    setHighlightValue(null);
    setManualCheckResult(null);
    setHintCell(null);
    setWin(false);
    userEditedAfterHint.current = false;
    setHistory([{ board: puzzle, notes: {} }]);
    setTimeElapsed(0); // reset timer on new puzzle
    hasUsedSolver.current = false; // Reset solver flag
    const locks = new Set();
    puzzle.forEach((row, r) =>
      row.forEach((val, c) => {
        if (val !== 0) locks.add(`${r}-${c}`);
      })
    );
    setLockedCells(locks);
  }, [seed, clues, navigate, urlSeed, difficulty]);


  const handleApplySeed = () => {
    if (seedInput.trim() && seedInput !== seed) {
      setSeed(seedInput.trim());
    }
  };

  useEffect(() => {
    if (win) {
      if (!hasUsedSolver.current) {
        setStatistics(prev => {
          const diffStats = prev[difficulty];
          const newWon = diffStats.won + 1;
          const newBest = diffStats.bestTime === null ? timeElapsed : Math.min(diffStats.bestTime, timeElapsed);

          const newStats = {
            ...prev,
            [difficulty]: { won: newWon, bestTime: newBest }
          };
          localStorage.setItem("sudokuStats", JSON.stringify(newStats));
          return newStats;
        });
      }
    }
  }, [win, difficulty, timeElapsed]);

  useEffect(() => {
    if (win) return;
    const timer = setInterval(() => {
      setTimeElapsed((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [win]);

  const boardRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (boardRef.current && !boardRef.current.contains(event.target)) {
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
    } else if (selectedCell && board[selectedCell[0]][selectedCell[1]] !== 0) {
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
      setSelectedCell(null);
      setHighlightValue(null);
      return newHist;
    });
  };

  const toggleNote = useCallback((r, c, num) => {
    const key = `${r}-${c}`;
    setNotes(prev => {
      const newNotes = { ...prev };
      const cellNotes = new Set(newNotes[key] || []);
      if (cellNotes.has(num)) cellNotes.delete(num);
      else cellNotes.add(num);
      if (cellNotes.size === 0) delete newNotes[key];
      else newNotes[key] = cellNotes;
      
      setHistory(prevHist => {
         const currentBoard = prevHist[prevHist.length - 1].board;
         return [...prevHist, { board: currentBoard, notes: newNotes }];
      });
      return newNotes;
    });
  }, []);

  const fillCell = useCallback((r, c, num) => {
    if (lockedCells.has(`${r}-${c}`)) return;
    
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

           [rKey, cKey, bKey].forEach(key => {
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
    
    setHistory((prev) => [...prev, { board: newBoard, notes: newNotes }]);
    setManualCheckResult(null);
    if (hintCell !== null) {
      userEditedAfterHint.current = true;
      setHintCell(null);
    }
    if (isComplete(newBoard, solution)) setWin(true);
  }, [board, lockedCells, hintCell, solution, notes, autoRemoveNotes]); 

  const handleErase = () => {
    if (selectedCell && !lockedCells.has(`${selectedCell[0]}-${selectedCell[1]}`)) {
      fillCell(selectedCell[0], selectedCell[1], 0);
    }
  };

  const handleCellClick = (r, c) => {
    setSelectedCell([r, c]);
    
    const cellValue = board[r][c];
    if (cellValue !== 0) {
        // Smart Interaction: Select the number
        setSelectedNumber(cellValue);
    } else {
        // Empty cell
        if (selectedNumber !== null) {
            if (isNoteMode) {
                toggleNote(r, c, selectedNumber);
            } else {
                fillCell(r, c, selectedNumber);
            }
        }
    }
  };

  const handleNumberSelect = (num) => {
    if (selectedNumber === num) setSelectedNumber(null);
    else {
      setSelectedNumber(num);
      if (
        selectedCell &&
        !lockedCells.has(`${selectedCell[0]}-${selectedCell[1]}`)
      ) {
        const [r, c] = selectedCell;
        // If cell is empty or we are overwriting
        // Check mode
        if (board[r][c] === 0) {
             if (isNoteMode) toggleNote(r, c, num);
             else fillCell(r, c, num);
        } else {
            // Cell occupied, overwrite if not locked (handled by fillCell check)
            // If Note Mode, usually we don't put notes on filled cells.
             if (!isNoteMode) fillCell(r, c, num);
        }
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

  const showHint = () => {
    if (hintCell !== null) return;
    const emptyCells = [];
    board.forEach((row, r) =>
      row.forEach((val, c) => {
        if (val === 0) emptyCells.push([r, c]);
      })
    );
    if (!emptyCells.length) {
      alert("No empty cells to hint.");
      return;
    }
    const idx = Math.floor(Math.random() * emptyCells.length);
    const [r, c] = emptyCells[idx];
    fillCell(r, c, solution[r][c]);
    setHintCell(`${r}-${c}`);
    userEditedAfterHint.current = false;
    userEditedAfterHint.current = false;
  };

  const visualizeSolver = async () => {
    if (solvingRef.current || win) return;
    setSolving(true);
    solvingRef.current = true;
    hasUsedSolver.current = true; // Mark that solver was used to disable stats

    // Create a mutable copy of the board for logic
    const currentBoard = board.map(row => row.slice());

    // Backtracking function
    const solve = async () => {
      if (!solvingRef.current) return false;

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentBoard[r][c] === 0) {
            for (let n = 1; n <= 9; n++) {
              if (!solvingRef.current) return false;

              if (isValid(currentBoard, r, c, n)) {
                currentBoard[r][c] = n;
                setBoard(currentBoard.map(row => row.slice())); // Update UI
                setSelectedCell([r, c]);

                await sleep(20); // Delay for visualization

                if (await solve()) return true;

                currentBoard[r][c] = 0;
                setBoard(currentBoard.map(row => row.slice())); // Backtrack on UI
                await sleep(5); // Smaller delay on backtrack?
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    await solve();

    if (isComplete(currentBoard, solution)) {
      setWin(true);
    }

    setSolving(false);
    solvingRef.current = false;
    setSelectedCell(null);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!selectedCell || win) return;
      const [r, c] = selectedCell;
      if (lockedCells.has(`${r}-${c}`)) return;
      
      // Toggle Note Mode with 'N'
      if (e.key === 'n' || e.key === 'N') {
          setIsNoteMode(prev => !prev);
          return;
      }

      if (/^[1-9]$/.test(e.key)) {
        const num = Number(e.key);
        if (isNoteMode && board[r][c] === 0) {
            toggleNote(r, c, num);
        } else {
            fillCell(r, c, num);
        }
      } else if (e.key === "Backspace" || e.key === "Delete") {
        fillCell(r, c, 0); // Clears cell and notes
      } else if (e.key === "ArrowUp" && r > 0) setSelectedCell([r - 1, c]);
      else if (e.key === "ArrowDown" && r < 8) setSelectedCell([r + 1, c]);
      else if (e.key === "ArrowLeft" && c > 0) setSelectedCell([r, c - 1]);
      else if (e.key === "ArrowRight" && c < 8) setSelectedCell([r, c + 1]);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedCell, win, board, lockedCells, fillCell, isNoteMode, toggleNote]);

  const handleButtonClick = useCallback((btnName, cb) => {
    setPoppedButton(btnName);
    cb();
    setTimeout(() => setPoppedButton(null), 150);
  }, []);

  const isWrong = useMemo(() => {
    if (!continuousCheck) return new Set();
    const wrongs = new Set();
    board.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val !== 0 && val !== solution[r][c]) wrongs.add(`${r}-${c}`);
      });
    });
    return wrongs;
  }, [board, solution, continuousCheck]);




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
          timeElapsed={timeElapsed}
          stats={statistics[difficulty]}
          hasUsedSolver={hasUsedSolver.current}
          theme={theme}
          themeColors={themeColors}
        />
      )}
      {manualCheckResult !== null && (
        <div
          style={{
            position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
            backgroundColor: manualCheckResult ? '#22c55e' : '#ef4444',
            color: '#fff', padding: '10px 20px', borderRadius: 8, zIndex: 2000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontWeight: 'bold'
          }}
          onClick={() => setManualCheckResult(null)} // Click to dismiss
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
      />

      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between p-4 md:p-6 mb-2 relative z-10">
           <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all w-fit"
          >
              <ArrowLeft size={18} /> <span className="hidden md:inline">Back</span>
          </button>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm">
                  Sudoku
              </h1>
               <div className="flex justify-center items-center gap-2 mt-1">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-xs bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
                        {difficulty}
                    </span>
               </div>
          </div>

          <button
            onClick={() => setSettingsVisible(true)}
            className="flex items-center justify-center p-3 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all shadow-lg"
            title="Settings"
          >
            <SettingsIcon size={20} />
          </button>
      </div>
      {/* Controls below numbers */}
      <Controls
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        seedInput={seedInput}
        setSeedInput={setSeedInput}
        currentSeed={seed}
        onRandomize={() => {
          const newSeed = randomSeed();
          setSeed(newSeed);
          setSeedInput(newSeed);
        }}
        onUndo={undo}
        undoDisabled={history.length <= 1}
        onCheck={onManualCheck}
        checkDisabled={continuousCheck}
        onHint={showHint}
        onVisualizeSolver={visualizeSolver}
        solving={solving}
        poppedButton={poppedButton}
        handleButtonClick={handleButtonClick}
        onApplySeed={handleApplySeed}
        isNoteMode={isNoteMode}
        onToggleNoteMode={() => setIsNoteMode(prev => !prev)}
        theme={theme}
        themeColors={themeColors}
      />
      {/* Timer above the Sudoku */}
      <div
        style={{
          backgroundColor:
            theme === "light"
              ? "rgba(255, 255, 255, 0.7)" // translucent light for light theme
              : "rgba(0, 0, 0, 0.6)", // translucent dark for dark theme
          backdropFilter: "blur(6px)",
          padding: "8px 20px",
          borderRadius: 12,
          boxShadow:
            theme === "light"
              ? "0 4px 12px rgba(0, 0, 0, 0.1)"
              : "0 4px 12px rgba(0, 0, 0, 0.7)",
          fontFamily: "'Courier New', Courier, monospace",
          fontWeight: "700",
          fontSize: "1.3rem",
          color: themeColors.boardBorder, // text color from theme (ensure contrast)
          userSelect: "none",
          minWidth: 90,
          textAlign: "center",
          marginBottom: 12,
          border:
            theme === "light"
              ? "1px solid rgba(0, 0, 0, 0.1)"
              : "1px solid rgba(255, 255, 255, 0.15)",
        }}
        role="timer"
        aria-live="polite"
        aria-label="Elapsed time"
        title="Elapsed time"
      >
        {new Date(timeElapsed * 1000).toISOString().substr(14, 5)}
      </div>
      {/* Sudoku board */}
      <div ref={boardRef}>
        <SudokuBoard
          board={board}
          lockedCells={lockedCells}
          isWrong={isWrong}
          hintCell={hintCell}
          userEditedAfterHint={userEditedAfterHint}
          selected={selectedCell}
          setSelected={setSelectedCell}
          onCellClick={handleCellClick}
          solution={solution}
          win={win}
          themeColors={themeColors}
          highlightValue={highlightValue}
          theme={theme}
          notes={notes}
          highlightGuides={highlightGuides}
        />
      </div>
      {/* Numbers below the Sudoku */}
      <NumberSelector
        selected={selectedNumber}
        setSelected={handleNumberSelect}
        onErase={handleErase}
        themeColors={themeColors}
      />
      <style>{`
        @keyframes hintBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>{" "}
    </div>
  );
}
