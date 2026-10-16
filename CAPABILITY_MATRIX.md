# Capability Matrix

What each page of the Visualizer & Games Platform can do, verified against the code in
`src/`, `server/src/`, and the route registry in `src/data/visualizers.js`.

**Legend:** ✅ supported · ◐ partial / limited · ❌ not supported · — not applicable

---

## 1. Platform capabilities

| Capability | Status | Where |
|---|---|---|
| Registry-driven routing (add a page = one registry entry) | ✅ | `src/data/visualizers.js`, `src/App.js` |
| Lazy-loaded routes (code-split per page) | ✅ | `React.lazy` in `src/data/visualizers.js` |
| Responsive dark theme (Tailwind) | ✅ | Tailwind utilities, `bg-[#0B0C15]` theme |
| Real-time multiplayer backend | ✅ | Express + Socket.IO, `server/src/` |
| Chess engine (Stockfish WASM, adjustable depth) | ✅ | `src/Page/Games/Chess/StockfishEngine.js` |
| Deterministic seeded generation (same seed = same board) | ✅ | mulberry32 PRNG in Sudoku, Killer, Minesweeper, Falling Blocks, Snake |
| Shareable URLs (seed or room links copied to clipboard) | ✅ | Sudoku, Killer, Minesweeper, Falling Blocks, Snake, Chess/Tic-Tac-Toe/Forbidden Words online |
| Client-side persistence (preferences / best scores) | ✅ | `localStorage` in 10 pages (see §3) |
| In-game audio / sound effects | ❌ | no `Audio` / `AudioContext` usage anywhere in `src/` |
| User accounts / cloud saves | ❌ | no auth layer; state is per-browser only |
| Automated tests | ◐ | `yarn test` (CRA) + `yarn test:killer` (`scripts/verify-killer.js`) |

---

## 2. Algorithm & math visualizers

| Visualizer | Route | Algorithms / modes | Playback (play · pause · step) | Speed control | User input | Readouts |
|---|---|---|---|---|---|---|
| Sorting | `/sort` | 9: Bubble, Selection, Insertion, Quick, Merge, Heap, Shell, Cocktail Shaker, Radix | ✅ play · pause · step · reset | ✅ slider | ✅ custom array (incl. negatives), array size | ✅ live comparisons / swaps / writes counters |
| Pathfinding | `/PathFinding` | 6: Dijkstra, A*, BFS, DFS, Greedy Best-First, Bidirectional BFS + Recursive-Division maze generator | ✅ run · reset | ✅ slider (`speed`) | ✅ draw/erase walls, grid size, maze generation | ✅ visited-node legend |
| Game of Life | `/CellularAutomata` | Conway rules | ✅ run · pause · reset | ✅ slider (100–1000 ms) | ✅ paint cells, randomize, clear | ✅ generation counter |
| N-Pendulum | `/pendulum` | N linked segments, string / spring modes | ✅ pause (physics keeps state) | ◐ fixed simulation step (`simDt`) | ✅ N, per-segment angles, materials, draggable control panel | ✅ FPS, trails |
| MST | `/mst` | Prim's, Kruskal's | ✅ run · pause · reset | ✅ slider | ✅ node count / regenerate graph | ◐ node & edge highlighting |
| Convex Hull | `/convex-hull` | Graham Scan, Jarvis March, Monotone Chain | ✅ run · reset | ✅ slider | ◐ regenerate point set (no free point placement) | ✅ step messages |
| N-Queens | `/nqueens` | Backtracking search | ✅ run · pause · reset | ✅ slider | ✅ N slider (board size) | ✅ solution count, solution browser, attack-cell overlay |
| Kinetic Clock | `/KineticClock` | 24-clock animated display | — passive animation | ❌ | ❌ | — |
| Prime Spirals | `/prime-spirals` | Ulam spiral, Sacks (Archimedean) spiral | ✅ reveal sweep: play · pause · step · show all | ✅ fixed 55 ms sweep tick | ✅ max number (1k–100k), zoom, theme color | ✅ reveal progress (% + primes shown), prime legend |

---

## 3. Games

| Game | Route | Difficulty / variants | AI or solver | Online multiplayer | Local multiplayer | Share & persistence | Touch |
|---|---|---|---|---|---|---|---|
| Sudoku | `/Sudoku` | Easy → Extreme, seed | ✅ solver with method picker: **Logic Only** (naked/hidden singles, explains placements) vs **Fast (MRV)** instant | ❌ | — | ✅ seed URL · `localStorage` | ◐ on-screen buttons |
| Killer Sudoku | `/KillerSudoku` | Easy → Extreme (cage coarsening), seed, ambiguity-targeted cage generation | ✅ shared MRV engine, instant solver + replay animation | ❌ | — | ✅ seed URL · `localStorage` | ◐ on-screen buttons |
| Falling Blocks | `/FallingBlocks` | Speed ramps with score | — | ❌ | — | ✅ seed URL · `localStorage` high score | ✅ dedicated touch handlers |
| Minesweeper | `/Minesweeper` | Adjustable difficulty, seed | — | ❌ | — | ✅ seed URL · `localStorage` | ◐ on-screen buttons |
| Flappy Bird | `/FlappyBird` | Score chase | — | ❌ | — | ✅ `localStorage` best score | ✅ tap controls |
| Forbidden Words | `/ForbiddenWords/*` | Team rounds + turn timer (server-authoritative) | — | ✅ rooms, link to join, team scoring | ✅ pass-and-play party mode | ✅ room link copy · `localStorage` | ◐ on-screen buttons |
| Tic-Tac-Toe | `/TicTacToe/*` | Classic & disappearing board variants (online) | ✅ unbeatable Minimax (Solo) | ✅ rooms, link to join | ✅ same-device PvP | ✅ room link copy · `localStorage` | ◐ on-screen buttons |
| Chess | `/Chess/*` | Time controls, board themes | ✅ Stockfish (adjustable depth) + analysis board | ✅ rooms, chat, rematch | ✅ local PvP | ✅ room link · PGN copy/import · `localStorage` | ◐ on-screen buttons |
| Snake | `/Snake` | Three brains: manual, BFS bot, LLM scorer (OpenAI-compatible endpoint) | ✅ BFS bot & LLM brain | ❌ | — | ✅ seed URL · `localStorage` | ◐ on-screen buttons (keyboard primary) |
| Wordle Helper | `/wordle-helper` | Helper mode + full play mode | ✅ candidate filter, best-guess & eliminator suggestions | ❌ | — | ❌ | ◐ on-screen buttons |

---

## 4. Multiplayer backend (`server/`)

| Capability | Status | Evidence |
|---|---|---|
| Socket.IO rooms for Chess, Tic-Tac-Toe, Forbidden Words | ✅ | `server/src/handlers/{chess,tictactoe,taboo}Handler.ts` |
| Authoritative game state on the server | ✅ | `server/src/services/{Chess,TicTacToe,Taboo}Service.ts` |
| Chess: time controls, chat, rematch | ✅ | `chessHandler.ts` (`chess_create_room` + `timeControl`, chat & rematch blocks) |
| Forbidden Words: teams, rounds, turn & round timers, scores | ✅ | `tabooHandler.ts` (`currentTeam`, `currentRound`, `timer`, `scores`) |
| Tic-Tac-Toe: room create/join, board variants | ✅ | `tictactoeHandler.ts` (`variant: 'classic' \| 'disappearing'`) |
| Typed shared server types | ✅ | `server/src/models/types.ts` |

---

## 5. Known gaps

- **No sound** anywhere in the frontend.
- **No accounts** — scores and preferences live in `localStorage` only.
- **Kinetic Clock** is a passive animation — nothing to control.
- **No swipe gestures** outside Flappy Bird and Falling Blocks; other games (incl. Snake's D-pad) rely on tappable buttons or keyboard.
- **Tests** cover the Killer Sudoku generator (`yarn test:killer`) only; the CRA `yarn test` suite is effectively unused.

*Update this file when a page gains or loses a capability.*
