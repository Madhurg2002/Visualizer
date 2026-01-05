import { rotateMatrix } from '../utils/rotate';

export const BASE_PIECES = {
  I: [[1, 1, 1, 1]],
  J: [
    [2, 0, 0],
    [2, 2, 2],
  ],
  L: [
    [0, 0, 3],
    [3, 3, 3],
  ],
  O: [
    [4, 4],
    [4, 4],
  ],
  S: [
    [0, 5, 5],
    [5, 5, 0],
  ],
  T: [
    [0, 6, 0],
    [6, 6, 6],
  ],
  Z: [
    [7, 7, 0],
    [0, 7, 7],
  ],
};

export const TETROMINO_NAMES = Object.keys(BASE_PIECES);

export const PRECOMPUTED_TETROMINOS = {};
for (const [key, shape] of Object.entries(BASE_PIECES)) {
  const rotations = [shape];
  for (let i = 1; i < 4; i++) {
    rotations.push(rotateMatrix(rotations[i - 1]));
  }
  PRECOMPUTED_TETROMINOS[key] = rotations;
}
