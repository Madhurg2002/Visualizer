# Skill: Algorithms & Games Pages

Use when adding/modifying a visualizer or game under `src/Page/Algorithm/` or `src/Page/Games/`.

## Anatomy of a page folder

```
Page/Games/Sudoku/
├── index.js          # page component: state, effects, layout; registered in visualizers.js
├── utils.js          # pure logic (generation, validation, seeds)
├── SudokuBoard.js    # render-heavy board (memoized)
├── Controls.js       # buttons/difficulty/seed UI
├── themes.js         # THEMES map -> color tokens
└── ...
```

Keep **logic in utils files** and **rendering in components**; `index.js` orchestrates state.

## Simulation loop patterns (do not reinvent)

1. **Generator + hook step**: `Page/Algorithm/Sorting/hooks/useSort.js` steps generator functions
   yielding `{ arr, active }` snapshots with `setTimeout`. Consumers depend on that shape —
   never break it. New sort/pathfinding algos: add a generator to
   `Sorting/utils/sortingAlgorithms.js` / `Pathfinding/algorithms.js`, not inline state code.
2. **Interval hook**: `Page/Games/FallingBlocks/hooks/useInterval.js` — reuse for tick loops
   (gravity, timers, automata evolution).
3. **Async backtracking viz**: Sudoku `index.js` `visualizeSolver()` — `await sleep(ms)` between
   steps, guarded by `solvingRef` so stop/unmount works. Copy this pattern for step-by-step
   solvers.
4. **Canvas games**: FlappyBird `GameCanvas.jsx`, Pendulum `PendulumCanvas.jsx` — `requestAnimationFrame`
   or physics in a separate `*Physics.js`, controls in a separate `*Controls.jsx`.

## Deterministic seeds (replayable puzzles)

Sudoku/KillerSudoku are the reference: `randomSeed()` → URL `?seed=` param → seeded
`puzzleFromFull(full, clues, seed + difficulty)`; Killer cages derive from
`generateCages(seed, difficulty, full)`. Everything must be reproducible from the seed string
alone — never call `Math.random` inside generation paths; thread the seed/derived RNG through.

## Page chrome (consistency contract)

- Wrap content in `<div className="flex flex-col items-center w-full min-h-screen bg-[#0B0C15] ...">`.
- Header via shared `PageHeader` + `Pill` (`src/Components/PageHeader.js`) inside
  `w-full max-w-4xl px-4 pt-4 pb-1 mb-2`.
- Board/play area: fixed max width (e.g. `max-w-[500px]`) centered; overlays (generating,
  winning) absolutely positioned inside a `relative` wrapper.
- Dark theme is default; Sudoku supports `?theme=` via `themes.js` — only add theming if asked.
- Games show win/lose via modal components (see `WinningModal.js`) + `Confetti`.

## State hygiene

- Undo/history = array of snapshots `{ board, notes }` (Sudoku pattern); push on every mutation.
- Stats/best-times go to `localStorage` under a stable key; guard solver-assisted wins.
- Keyboard input: single `keydown` effect with deps `[selectedCell, ...]`; clean up listeners.
- Confirm destructive restarts with `window.confirm` when `isDirty`.

## Registration checklist

1. Page folder + default export in `index.js`.
2. `lazy(() => import(...))` + entry in `ALGORITHMS`/`GAMES` in `src/data/visualizers.js`
   (unique `path`, lucide icon, gradient `color`, honest `description`).
3. `yarn build` + click through from Home and navbar.
