# CLAUDE.md — Visualizer & Games Platform

> Guidance for Claude Code working in this repository.
> Read this first; then load the skills in `.claude/skills/` that match the task.

## Project Snapshot

- **Product**: Educational platform combining interactive algorithm/math visualizers with puzzle, arcade, and party games. Live at [visualiz.vercel.app](https://visualiz.vercel.app).
- **Frontend**: React 18 (Create React App `react-scripts`), `react-router-dom` v6, Tailwind CSS v3, Framer Motion v12, lucide-react icons, `react-select`, `socket.io-client`, `stockfish` (WASM engine).
- **Backend**: `server/` — Node.js + Express + Socket.IO written in TypeScript (`server/src/`, layered as `handlers/` → `services/` → `models/types.ts`). Powers real-time multiplayer (Forbidden Words, Tic-Tac-Toe online, Chess online).
- **Package manager**: Yarn 4 (`packageManager` field). Root scripts: `yarn start`, `yarn build`, `yarn test`.
- **Node**: >= 14.

## Architecture

```
src/
├── App.js                    # BrowserRouter + lazy() routes generated from ALGORITHMS/GAMES registries
├── data/visualizers.js       # Single source of truth: { title, description, path, component, color, icon }
├── Components/               # Shared UI (Navbar, Layout, Button, Loading, Confetti)
└── Page/
    ├── Algorithm/            # Pathfinding, Sorting, MST, ConvexHull, NQueens, Pendulum, PrimeSpirals, CellularAutomata
    └── Games/                # Chess, TicTacToe, Sudoku, KillerSudoku, Minesweeper, FallingBlocks, FlappyBird, ForbiddenWords, WordleHelper, KineticClock, Snake
server/src/
├── index.ts                  # Express + Socket.IO bootstrap (PORT = env.PORT || 3001)
├── handlers/                 # Per-game socket handlers (taboo, tictactoe, chess)
├── services/                 # Game rules & authoritative state (Chess/Taboo/TicTacToeService.ts)
├── models/types.ts           # Shared server-side TypeScript types
└── data/                     # Server-side data (e.g. forbiddenWords.ts)
```

**Key patterns:**
- **Registry-driven routing**: Every page is lazy-loaded in `src/data/visualizers.js` and exported as `ALGORITHMS` or `GAMES`. `App.js` and `Navbar.js` both map over these arrays. **Adding a new visualizer/game = add one entry there** (plus the page folder); routing and nav update automatically.
- **Simulation loops**: Most visualizers/games advance state via generator functions stepped by `setTimeout`/`setInterval` in custom hooks (see `Page/Algorithm/Sorting/hooks/useSort.js`, `Page/Games/FallingBlocks/hooks/useInterval.js`).
- **Styling**: Tailwind utility classes, dark "deep space" theme (`bg-[#0B0C15]`), gradient accents (`from-indigo-400 via-purple-400 to-pink-400`), glassmorphism navbar (`bg-slate-900/80 backdrop-blur-xl border border-white/10`), Outfit (headings) / Inter (body) fonts. Some legacy pages use plain CSS files (`NQueens.css`, `Pathfinding/Index.css`) — prefer Tailwind for new work but don't rewrite working CSS without being asked.
- **Mixed JS/TS**: Frontend is `.js`/`.jsx`; the multiplayer server is TypeScript.

## Conventions for Agents

1. **Match surrounding style** — 4-space indentation is common in this codebase; default function exports for pages/components.
2. **Register everything** — a new page is only reachable if added to `src/data/visualizers.js` with a unique route path and an icon from `lucide-react`.
3. **Reusable hooks before duplication** — check for an existing hook (`useInterval`, `useSort`, game-state hooks) before writing new timing/loop logic.
4. **Icons from lucide-react only** — no emoji-as-icon in UI chrome; icons already imported are reused.
5. **Don't break the generator pattern** — sorting/pathfinding visualizations yield `{ arr, active }` snapshots; consumers expect that shape.
6. **Server changes** — game logic handlers live in `server/src/handlers/`; emit typed event names consistent with the existing client code; never break the event contract used by `Local.js`/`Online.js` client files.
7. **Performance matters** — visualizers re-render rapidly; avoid recreating arrays/objects in render, use refs for mutable simulation state, and keep large grids inside `useMemo`/`useCallback` where practical.
8. **Verification** — after changes run `yarn build` (or at minimum `yarn start` and click through affected routes). There is no lint config; don't add one without being asked.

## Common Tasks → Playbooks

| Task | Skill to load |
|---|---|
| Add or modify a visualizer/game page | `frontend/react-components`, `frontend/algorithms-and-games` |
| Style/polish any UI | `frontend/tailwind-styling` |
| Add/modify online multiplayer | `frontend/socket-features` + read `server/src/handlers/` |
| Add a navbar entry, card, or route | `frontend/react-components` (registry pattern) |

Skills live in `.claude/skills/<name>/SKILL.md`.
