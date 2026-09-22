# Skill: Tailwind Styling (Deep Space Theme)

Use when styling or polishing any UI in this app. The app has one visual language — keep pages
indistinguishable in style except for their accent gradient.

## Design tokens

- Background: `bg-[#0B0C15]` (deep space) — pages set it themselves; `Layout` also applies it.
- Text: `text-white` headings, `text-slate-300/400` body.
- Brand gradient: `from-indigo-400 via-purple-400 to-pink-400` (titles use
  `bg-clip-text text-transparent bg-gradient-to-r ...` + `drop-shadow-sm`).
- Glassmorphism: `bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl`
  (navbar, settings panels); lighter glass: `bg-slate-800/80 ... border-white/10` for buttons.
- Rounded: cards `rounded-3xl`, panels/nav `rounded-2xl`, buttons/pills `rounded-full`/`rounded-lg`.
- Shadows: `shadow-lg`/`shadow-2xl`; hover states `hover:bg-slate-700/90 hover:text-white
  transition-all`.
- Fonts: Outfit (headings) / Inter (body) — already wired in `index.html`; use `font-sans`.

## Component recipes

- **Pill badge** (difficulty, counts): `text-slate-400 font-bold uppercase tracking-wider text-xs
  bg-slate-900/50 px-3 py-1 rounded-full border border-white/5` — reuse `Pill` from
  `src/Components/PageHeader.js` instead of re-rolling.
- **Primary button**: `src/Components/Button.js` variants; custom inline buttons should copy its
  base: `inline-flex items-center justify-center font-medium transition-all duration-200
  focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg active:scale-95`.
- **Circular icon action** (settings/back): `flex items-center justify-center p-3 bg-slate-800/80
  hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300
  hover:text-white transition-all shadow-lg` + `focus-visible:ring-2 focus-visible:ring-blue-400
  focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C15]`.
- **Home cards**: `bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:border-white/20`
  with `bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10` overlay and gradient
  icon tile `w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color}`.
- **Section heading** (Home): `text-2xl font-bold text-slate-300 mb-8 border-l-4 border-blue-500 pl-4`.
- **Page title**: `PageHeader` renders `text-3xl md:text-5xl font-black bg-clip-text
  text-transparent bg-gradient-to-r` — per-page accent via the `accent` prop (e.g. amber for
  Sudoku, cyan for Killer mode accents).

## Motion (Framer Motion v12)

- Framer Motion is already a dependency — don't add alternatives.
- Page-level: `initial={{ opacity: 0, y: -20 }} animate={{ ... }}` hero entrances; staggered
  grids with `containerVariants`/`itemVariants` + `whileInView` + `viewport={{ once: true }}`.
- Micro-interactions: `whileHover={{ y: -8, scale: 1.02 }}` cards; `active:scale-95` buttons.
- AnimatePresence for dropdowns/modals; keep durations short (0.2–0.3s).

## Rules

1. **Valid Tailwind v3 classes only.** No invented utilities (`h-4.5`), no arbitrary values where
   a token exists. Arbitrary colors like `bg-[#0B0C15]` are established in this codebase — fine.
2. Lucide-react icons only; size via className (`w-8 h-8 text-white`) not props-only.
3. Some legacy pages have plain CSS (`NQueens.css`, `Pathfinding/Index.css`) — don't rewrite
   working CSS without being asked; new work is Tailwind.
4. Don't remove `@tailwind` directives or theme tokens from `src/index.css`.
5. Contrast: body text ≥ `text-slate-400` on `#0B0C15`; white text on gradient tiles.
6. Responsive: mobile-first; grids `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`; hide labels on
   small screens with `hidden md:inline` (see PageHeader back button).

## Verification

`yarn build`, then visually check the changed page at mobile + desktop widths; gradients must not
obscure text and glass panels must stay legible over the animated background.
