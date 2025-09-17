import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const size = 3; // 9x9 blocks

function createSeededRNG(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return (h >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  let array = arr.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isValid(board, r, c, num) {
  for (let i = 0; i < 9; i++) {
    if (board[r][i] === num || board[i][c] === num) return false;
  }
  const br = r - (r % size);
  const bc = c - (c % size);
  for (let rr = br; rr < br + size; rr++) {
    for (let cc = bc; cc < bc + size; cc++) {
      if (board[rr][cc] === num) return false;
    }
  }
  return true;
}

function solve(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        for (let n = 1; n <= 9; n++) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (solve(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generateFullSolution(rand) {
  const board = Array(9).fill(0).map(() => Array(9).fill(0));
  function fill() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (const n of shuffle([1,2,3,4,5,6,7,8,9], rand)) {
            if (isValid(board, r, c, n)) {
              board[r][c] = n;
              if (fill()) return true;
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }
  fill();
  return board;
}

function removeClues(board, cluesCount, rand) {
  const total = 81;
  const positions = shuffle([...Array(total).keys()], rand);
  const newBoard = board.map(row => row.slice());
  let removed = 0;
  for (const pos of positions) {
    if (removed >= total - cluesCount) break;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    if (newBoard[r][c] === 0) continue;
    const temp = newBoard[r][c];
    newBoard[r][c] = 0;
    const copy = newBoard.map(row => row.slice());
    if (!solve(copy)) {
      newBoard[r][c] = temp;
    } else {
      removed++;
    }
  }
  return newBoard;
}

function randomSeed(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let res = "";
  for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return res;
}

export default function Sudoku() {
  const query = new URLSearchParams(window.location.search);
  const navigate = useNavigate();

  const urlSeed = query.get("seed") || "";
  const [seedInput, setSeedInput] = useState(urlSeed);
  const [seed, setSeed] = useState(urlSeed || randomSeed());
  const clues = 30;

  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [lockedCells, setLockedCells] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [checkMistakes, setCheckMistakes] = useState(false);
  const [manualCheckResult, setManualCheckResult] = useState(null);
  const [hintCell, setHintCell] = useState(null);

  const userEditedAfterHint = useRef(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (urlSeed !== seed) navigate(`?seed=${seed}`, { replace: true });
    const rand = createSeededRNG(seed);
    const full = generateFullSolution(rand);
    const puzzle = removeClues(full, clues, rand);
    setBoard(puzzle);
    setSolution(full);
    setSelected(null);
    setManualCheckResult(null);
    setHintCell(null);
    userEditedAfterHint.current = false;
    setHistory([puzzle]);

    const locks = new Set();
    puzzle.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val !== 0) locks.add(`${r}-${c}`);
      });
    });
    setLockedCells(locks);
  }, [seed, clues, navigate, urlSeed]);

  const updateBoard = useCallback((newBoard) => {
    setBoard(newBoard);
    setHistory(prev => [...prev, newBoard]);
    setManualCheckResult(null);
  }, []);

  const toggleCell = (r, c) => {
    if (lockedCells.has(`${r}-${c}`)) return;
    if (selected === null) return;
    const copy = board.map(row => row.slice());
    copy[r][c] = copy[r][c] === selected ? 0 : selected;
    updateBoard(copy);
    if(hintCell !== null) {
      userEditedAfterHint.current = true;
      setHintCell(null);
    }
  };

  const undo = () => {
    setHistory(prevHist => {
      if (prevHist.length <= 1) return prevHist;
      const newHist = prevHist.slice(0, prevHist.length - 1);
      setBoard(newHist[newHist.length - 1]);
      setManualCheckResult(null);
      userEditedAfterHint.current = true;
      setHintCell(null);
      return newHist;
    });
  };

  const isWrong = useMemo(() => {
    if (!checkMistakes) return new Set();
    const wrongs = new Set();
    board.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val !== 0 && val !== solution[r][c]) wrongs.add(`${r}-${c}`);
      });
    });
    return wrongs;
  }, [board, solution, checkMistakes]);

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
    const copy = board.map(row => row.slice());
    copy[r][c] = solution[r][c];
    updateBoard(copy);
    setHintCell(`${r}-${c}`);
    userEditedAfterHint.current = false;
  };

  const getCellBg = (r, c) => {
    const key = `${r}-${c}`;
    const locked = lockedCells.has(key);
    const wrong = isWrong.has(key);
    const hint = hintCell === key && !userEditedAfterHint.current;
    if (hint) return "#d1fae5";
    if (wrong) return "#fca5a5";
    if (locked) return "#e0e7ff";
    if (board[r][c] !== 0) return "#f3f4f6";
    return "white";
  };

  // Pop animation logic
  const buttonStyleBase = {
    padding: "8px 12px",
    margin: 4,
    border: "none",
    borderRadius: 4,
    fontWeight: "bold",
    cursor: "pointer",
    userSelect: "none",
    transition: "transform 0.15s ease-in-out",
  };

  const [poppedButton, setPoppedButton] = useState(null);

  const handleButtonClick = useCallback((btnName, cb) => {
    setPoppedButton(btnName);
    cb();
    setTimeout(() => setPoppedButton(null), 150);
  }, []);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8, fontWeight: "bold" }}>
          Enter Seed:{" "}
          <input
            type="text"
            value={seedInput}
            onChange={e => setSeedInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && seedInput.trim()) setSeed(seedInput.trim());
            }}
            placeholder="Type seed and press Enter"
            style={{ padding: 6, fontSize: 14, width: 150 }}
          />
        </label>
      </div>

      <button
        onClick={() => handleButtonClick("new", () => setSeed(randomSeed()))}
        style={{
          ...buttonStyleBase,
          backgroundColor: poppedButton === "new" ? "#1e40af" : "#2563eb",
          color: "white",
          transform: poppedButton === "new" ? "scale(1.1)" : "scale(1)",
        }}
      >
        Generate New Puzzle
      </button>

      <button
        onClick={() => handleButtonClick("undo", undo)}
        disabled={history.length <= 1}
        style={{
          ...buttonStyleBase,
          backgroundColor: poppedButton === "undo" ? "#831843" : "#9d174d",
          color: "white",
          marginLeft: 10,
          opacity: history.length <= 1 ? 0.5 : 1,
          cursor: history.length <= 1 ? "default" : "pointer",
          transform: poppedButton === "undo" ? "scale(1.1)" : "scale(1)",
        }}
      >
        Undo
      </button>

      <div style={{ margin: "10px 0" }}>
        <label style={{ marginRight: 15 }}>
          <input
            type="checkbox"
            checked={checkMistakes}
            onChange={e => setCheckMistakes(e.target.checked)}
          /> Check Mistakes
        </label>
        {!checkMistakes && (
          <button
            onClick={() => handleButtonClick("check", onManualCheck)}
            style={{
              ...buttonStyleBase,
              backgroundColor: poppedButton === "check" ? "#064e3b" : "#059669",
              color: "white",
              marginRight: 15,
              transform: poppedButton === "check" ? "scale(1.1)" : "scale(1)",
            }}
          >
            Check Filled Cells
          </button>
        )}
        <button
          onClick={() => handleButtonClick("hint", showHint)}
          style={{
            ...buttonStyleBase,
            backgroundColor: poppedButton === "hint" ? "#744210" : "#b45309",
            color: "white",
            transform: poppedButton === "hint" ? "scale(1.1)" : "scale(1)",
          }}
        >
          Show Hint
        </button>
      </div>

      {manualCheckResult !== null && (
        <div
          style={{
            marginBottom: 12,
            color: manualCheckResult ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {manualCheckResult ? "All filled cells are correct!" : "There are incorrect entries!"}
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        {[...Array(9)].map((_, i) => {
          const n = i + 1;
          const isSelected = selected === n;
          return (
            <button
              key={n}
              onClick={() => handleButtonClick(`num${n}`, () => setSelected(isSelected ? null : n))}
              style={{
                ...buttonStyleBase,
                backgroundColor: isSelected ? "#2563eb" : "#e5e7eb",
                color: isSelected ? "white" : "black",
                transform: poppedButton === `num${n}` ? "scale(1.1)" : "scale(1)",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(9, 40px)",
          border: "2px solid black",
          margin: "0 auto",
          width: 360,
          userSelect: "none",
        }}
      >
        {board.flatMap((row, r) =>
          row.map((val, c) => {
            const borderRight = (c + 1) % size === 0 ? "2px solid black" : "1px solid #999";
            const borderBottom = (r + 1) % size === 0 ? "2px solid black" : "1px solid #999";
            const key = `${r}-${c}`;
            const isLocked = lockedCells.has(key);
            const wrong = isWrong.has(key);
            const isHint = hintCell === key && !userEditedAfterHint.current;

            // Determine background color
            let bgColor = "white";
            if (isHint) bgColor = "#d1fae5";
            else if (wrong) bgColor = "#fca5a5";
            else if (isLocked) bgColor = "#e0e7ff";
            else if (val !== 0) bgColor = "#f3f4f6";

            return (
              <div
                key={key}
                onClick={() => toggleCell(r, c)}
                style={{
                  width: 40,
                  height: 40,
                  lineHeight: "40px",
                  textAlign: "center",
                  fontWeight: isLocked ? "bold" : "normal",
                  fontSize: "1.5rem",
                  cursor: isLocked ? "default" : selected === null ? "default" : "pointer",
                  backgroundColor: bgColor,
                  borderRight,
                  borderBottom,
                  color: isLocked ? "#111827" : wrong ? "#b91c1c" : "#111827",
                  userSelect: "none",
                }}
                title={
                  isLocked
                    ? "Clue (locked)"
                    : wrong
                    ? "Incorrect value"
                    : isHint
                    ? `Hint: ${solution[r][c]}`
                    : ""
                }
              >
                {isHint ? solution[r][c] : val || ""}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
