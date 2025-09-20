// src/Page/Sudoku/index.js
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  randomSeed,
  generateFull,
  puzzleFromFull,
  isComplete,
  DIFFICULTY,
} from "./utils";
import SudokuBoard from "./SudokuBoard";
import Controls from "./Controls";
import WinningModal from "./WinningModal";
import NumberSelector from "./NumberSelector";
import Settings from "./Settings";
import { THEMES } from "./themes";

function SettingsIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      height={size}
      width={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 12 3V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51z" />
    </svg>
  );
}

export default function Sudoku() {
  const navigate = useNavigate();
  const query = new URLSearchParams(window.location.search);

  const urlSeed = query.get("seed") || "";
  const [difficulty, setDifficulty] = useState("easy");
  const [seedInput, setSeedInput] = useState(urlSeed);
  const [seed, setSeed] = useState(urlSeed || randomSeed());
  const clues = DIFFICULTY[difficulty];

  const [settingsVisible, setSettingsVisible] = useState(false);

  const [theme, setTheme] = useState("light");
  const [continuousCheck, setContinuousCheck] = useState(false);

  const themeColors = THEMES[theme];

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
  const [poppedButton, setPoppedButton] = useState(null);

  const boardRef = useRef(null);
  useEffect(() => {
    if (urlSeed !== seed) navigate(`?seed=${seed}`, { replace: true });
    const full = generateFull(seed);
    const puzzle = puzzleFromFull(full, clues, seed + difficulty);
    setBoard(puzzle);
    setSolution(full);
    setSelectedCell(null);
    setSelectedNumber(null);
    setManualCheckResult(null);
    setHintCell(null);
    setWin(false);
    userEditedAfterHint.current = false;
    setHistory([puzzle]);
    const locks = new Set();
    puzzle.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val !== 0) locks.add(`${r}-${c}`);
      });
    });
    setLockedCells(locks);
  }, [seed, clues, navigate, urlSeed, difficulty]);

  useEffect(() => {
    if (seedInput.trim() && seedInput !== seed) setSeed(seedInput.trim());
  }, [seedInput]);

  useEffect(() => {
    document.body.style.backgroundColor = themeColors.bg;
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [themeColors.bg]);

  const undo = () => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const newHist = prev.slice(0, prev.length - 1);
      setBoard(newHist[newHist.length - 1]);
      setManualCheckResult(null);
      userEditedAfterHint.current = true;
      setHintCell(null);
      setSelectedCell(null);
      return newHist;
    });
  };

  const fillCell = (r, c, num) => {
    if (lockedCells.has(`${r}-${c}`)) return;
    const newBoard = board.map((row) => row.slice());
    if (newBoard[r][c] === num) {
      newBoard[r][c] = 0;
    } else {
      newBoard[r][c] = num;
    }
    setBoard(newBoard);
    setHistory((prev) => [...prev, newBoard]);
    setManualCheckResult(null);
    if (hintCell !== null) {
      userEditedAfterHint.current = true;
      setHintCell(null);
    }
    if (isComplete(newBoard, solution)) setWin(true);
  };

  const handleCellClick = (r, c) => {
    setSelectedCell([r, c]);
    if (selectedNumber !== null) {
      fillCell(r, c, selectedNumber);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (boardRef.current && !boardRef.current.contains(event.target)) {
        setSelectedCell(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setSelectedCell]);
  const handleNumberSelect = (num) => {
    if (selectedNumber === num) {
      setSelectedNumber(null);
    } else {
      setSelectedNumber(num);
      if (
        selectedCell !== null &&
        !lockedCells.has(`${selectedCell[0]}-${selectedCell[1]}`)
      ) {
        fillCell(selectedCell[0], selectedCell[1], num);
      }
    }
  };

  const onManualCheck = () => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== 0 && board[r][c] !== solution[r][c]) {
          setManualCheckResult(false);
          return;
        }
      }
    }
    setManualCheckResult(true);
  };

  const showHint = () => {
    if (hintCell !== null) return;
    const emptyCells = [];
    board.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val === 0) emptyCells.push([r, c]);
      });
    });
    if (emptyCells.length === 0) {
      alert("No empty cells to hint.");
      return;
    }
    const idx = Math.floor(Math.random() * emptyCells.length);
    const [r, c] = emptyCells[idx];
    fillCell(r, c, solution[r][c]);
    setHintCell(`${r}-${c}`);
    userEditedAfterHint.current = false;
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!selectedCell || win) return;
      const [r, c] = selectedCell;
      if (lockedCells.has(`${r}-${c}`)) return;
      if (/^[1-9]$/.test(e.key)) {
        fillCell(r, c, Number(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        fillCell(r, c, 0);
      } else if (e.key === "ArrowUp" && r > 0) setSelectedCell([r - 1, c]);
      else if (e.key === "ArrowDown" && r < 8) setSelectedCell([r + 1, c]);
      else if (e.key === "ArrowLeft" && c > 0) setSelectedCell([r, c - 1]);
      else if (e.key === "ArrowRight" && c < 8) setSelectedCell([r, c + 1]);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedCell, win, board, lockedCells]);

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
    <div
      style={{
        padding: 24,
        maxWidth: 480,
        margin: "auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: themeColors.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header with title, difficulty, and settings icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          marginBottom: 20,
          width: "100%",
          maxWidth: 480,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: themeColors.boardBorder,
            fontWeight: 700,
            fontSize: "2rem",
            flexGrow: 1,
          }}
        >
          Sudoku
        </h2>
        <span
          style={{
            fontSize: "1.2rem",
            fontWeight: "600",
            color: themeColors.boardBorder,
            userSelect: "none",
          }}
        >
          {difficulty.toUpperCase()}
        </span>
        <button
          onClick={() => setSettingsVisible(true)}
          aria-label="Open Settings"
          title="Settings"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: themeColors.boardBorder,
            width: 32,
            height: 32,
            userSelect: "none",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1e40af")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = themeColors.boardBorder)
          }
        >
          <svg
            height="24"
            width="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 12 3V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51z" />
          </svg>
        </button>
      </div>

      <Controls
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        seedInput={seedInput}
        setSeedInput={setSeedInput}
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
        poppedButton={poppedButton}
        handleButtonClick={handleButtonClick}
      />

      {manualCheckResult !== null && (
        <div
          style={{
            fontWeight: "bold",
            color: manualCheckResult ? "#059669" : "#db2777",
            fontSize: 18,
            textAlign: "center",
            marginBottom: 14,
          }}
        >
          {manualCheckResult
            ? "All filled cells are correct!"
            : "There are incorrect entries!"}
        </div>
      )}

      <NumberSelector
        selected={selectedNumber}
        setSelected={handleNumberSelect}
        themeColors={themeColors}
      />
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
        />
      </div>
      {win && <WinningModal onClose={() => setWin(false)} />}

      <Settings
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        continuousCheck={continuousCheck}
        setContinuousCheck={setContinuousCheck}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  );
}
