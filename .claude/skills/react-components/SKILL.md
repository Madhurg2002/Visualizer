# Skill: React Components & Registry Pattern

Use when adding or modifying pages, navbar entries, routes, cards, or shared UI components.

## Registry-driven routing (the core pattern)

`src/data/visualizers.js` is the **single source of truth**. Every page exists as one entry in
`ALGORITHMS` or `GAMES`:

```js
{
    title: "Killer Sudoku",
    description: "Classic 9x9 with seed sharing, or Killer mode with sum cages.",
    path: "/Sudoku",            // route path ("/Foo/*" for nested routers)
    linkPath: "/ForbiddenWords", // optional: nav link when path is a wildcard pattern
    component: Sudoku,           // MUST be a lazy() import at top of the file
    color: "from-amber-500 to-orange-400",  // Tailwind gradient used by card + icon bg
    icon: <Grid3x3 className="w-8 h-8 text-white" />  // lucide-react only
}
```

`App.js` maps `ALGORITHMS`/`GAMES` to `<Route>`s (all lazy-loaded inside one `<Suspense>` with
`<Loading />` fallback). `Navbar.js` builds its dropdowns from the same arrays. **Adding a page =
one entry in the registry + the page folder. Routing and nav update automatically.**

Sub-router games (Chess, TicTacToe, ForbiddenWords) use `path: "/Chess/*"` and their `index.js`
renders nested `<Routes>` with children like `local`, `ai`, `online`; `linkPath` is what the
navbar links to.

## Shared components (`src/Components/`)

- `PageHeader.js` — default export `PageHeader` (back button, centered gradient title,
  `subtitle`/`right` slots, `accent` gradient override) and named export `Pill` (small badge).
  **Every new page should use it**; it keeps headers consistent. Wrap in
  `<div className="w-full max-w-4xl px-4 pt-4 pb-1 mb-2">`.
- `Button.js` — variants `primary|secondary|danger|success|ghost|outline`, sizes `sm|md|lg|icon`,
  `loading` spinner, `icon` prop (lucide component). Prefer this over ad-hoc `<button>` for
  primary actions.
- `Layout.js` — page shell: `bg-[#0B0C15]`, glassmorphism `Navbar`, `main` with `pt-28`.
  Pages must NOT add their own top padding to clear the navbar; Layout already does.
- `Confetti.js` — celebration overlay (e.g. Sudoku win).
- `Loading.js` — route-level fallback.

## Conventions

1. Default exports for pages/components (`export default function Foo()`), named exports for
   helpers (`Pill`).
2. Icons: **lucide-react only**, never emoji in UI chrome. Check the icon isn't already imported
   by the file before adding a new import.
3. 4-space indentation; JSX prop order matches neighboring code.
4. Pages keep their own body color (`bg-[#0B0C15]`) and `min-h-screen w-full` wrappers.
5. Performance: pages re-render rapidly — memoize handlers with `useCallback`, grids with
   `useMemo`, and use refs for mutable simulation state (see Sudoku `index.js` for the pattern).
6. Old pages use `useNavigate`; do not introduce `react-router-dom` v6 API changes.

## Verification

`yarn build` must pass; then click through the new/changed route from the Home cards and the
navbar dropdowns.
