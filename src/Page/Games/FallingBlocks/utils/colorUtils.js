import { TETROMINO_NAMES } from '../data/tetrominoes';
import { makeRng } from './gameLogic';

const TAILWIND_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-400',
  'bg-green-400',
  'bg-teal-400',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-purple-500',
  'bg-pink-500',
];

export function assignRandomColorsToPieces(seed) {
  const rng = seed !== undefined ? makeRng(seed) : Math.random;
  const assignedColors = {};
  const availableColors = [...TAILWIND_COLORS];
  TETROMINO_NAMES.forEach((name) => {
    if (availableColors.length === 0) availableColors.push(...TAILWIND_COLORS);
    const colorIndex = Math.floor(rng() * availableColors.length);
    assignedColors[name] = availableColors.splice(colorIndex, 1)[0];
  });
  return assignedColors;
}
