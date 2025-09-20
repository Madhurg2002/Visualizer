// src/Page/Sudoku/utils.js
export const size = 3;
export const N = 9;
export const DIFFICULTY = { easy: 39, medium: 32, hard: 28 };

export function randomSeed(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let res = "";
  for (let i = 0; i < len; i++) res += chars[Math.floor(Math.random() * chars.length)];
  return res;
}
export function createSeededRNG(seed) {
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
export function shuffle(arr, rand) {
  let array = arr.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
export function isValid(board, r, c, n) {
  for (let i = 0; i < N; i++) {
    if (board[r][i] === n || board[i][c] === n) return false;
  }
  const br = r - (r % size), bc = c - (c % size);
  for (let i = br; i < br + size; i++)
    for (let j = bc; j < bc + size; j++)
      if (board[i][j] === n) return false;
  return true;
}
export function countSolutions(board, limit = 2) {
  let count = 0;
  function dfs() {
    if (count >= limit) return;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (board[r][c] === 0) {
          for (let n = 1; n <= N; n++) {
            if (isValid(board, r, c, n)) {
              board[r][c] = n;
              dfs();
              board[r][c] = 0;
            }
          }
          return;
        }
    count++;
  }
  dfs();
  return count;
}
export function generateFull(seed) {
  const rand = createSeededRNG(seed);
  const board = Array(N).fill(0).map(() => Array(N).fill(0));
  function fill(r = 0, c = 0) {
    if (r === N) return true;
    let nr = c === N - 1 ? r + 1 : r;
    let nc = c === N - 1 ? 0 : c + 1;
    for (let n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand)) {
      if (isValid(board, r, c, n)) {
        board[r][c] = n;
        if (fill(nr, nc)) return true;
        board[r][c] = 0;
      }
    }
    return false;
  }
  fill();
  return board;
}
export function puzzleFromFull(full, nClues, seed) {
  const rand = createSeededRNG(seed);
  let puzzle = full.map(row => row.slice());
  let positions = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      positions.push([r, c]);
  positions = shuffle(positions, rand);
  let cluesLeft = N * N;
  for (let [r, c] of positions) {
    if (cluesLeft <= nClues) break;
    let backup = puzzle[r][c];
    puzzle[r][c] = 0;
    let copy = puzzle.map(row => row.slice());
    if (countSolutions(copy, 2) > 1) {
      puzzle[r][c] = backup;
    } else {
      cluesLeft--;
    }
  }
  return puzzle;
}
export function isComplete(user, sol) {
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (user[r][c] !== sol[r][c]) return false;
  return true;
}
