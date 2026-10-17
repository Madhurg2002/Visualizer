// src/Page/Games/KillerSudoku/CageReadout.jsx
import React from "react";

/**
 * Readout bar for the cage containing the selected cell: target sum, digits
 * placed so far, running total, and what's still needed. Renders a neutral
 * placeholder when nothing is selected so the layout doesn't jump.
 *
 * Props:
 * - cage: { id, sum, cells } | null   — cage of the selected cell
 * - board: number[][]                 — current digits
 * - theme: "dark" | "light"
 */
export default function CageReadout({ cage, board, theme }) {
    const dark = theme !== "light";

    let body;
    if (!cage) {
        body = (
            <span className={dark ? "text-slate-500" : "text-slate-400"}>
                Select a cell to see its cage's sum readout
            </span>
        );
    } else {
        const placed = [];
        let total = 0;
        for (const [r, c] of cage.cells) {
            const v = board[r] ? board[r][c] : 0;
            if (v !== 0) {
                placed.push(v);
                total += v;
            }
        }
        const remaining = cage.sum - total;
        const size = cage.cells.length;
        const done = placed.length === size && total === cage.sum;
        const overflow = total > cage.sum;

        let status;
        if (done) {
            status = <span className="text-green-400 font-bold">✓ complete</span>;
        } else if (overflow) {
            status = <span className="text-red-400 font-bold">over by {total - cage.sum}</span>;
        } else {
            status = (
                <span>
                    needs <span className="text-cyan-300 font-bold">{remaining}</span> from{" "}
                    {size - placed.length} cell{size - placed.length === 1 ? "" : "s"}
                </span>
            );
        }

        body = (
            <>
                <span className="text-slate-400">
                    Cage <span className="text-cyan-300 font-bold">{cage.sum}</span>
                </span>
                <span className={dark ? "text-slate-600" : "text-slate-300"}>|</span>
                <span className="font-mono">
                    {placed.length ? placed.join(" + ") : "—"}
                    {placed.length > 0 && (
                        <span className="text-slate-400"> = {total}</span>
                    )}
                </span>
                <span className={dark ? "text-slate-600" : "text-slate-300"}>|</span>
                <span className="text-sm">{status}</span>
            </>
        );
    }

    return (
        <div
            className="w-full max-w-[500px] mx-auto px-4 md:px-0 mb-3 select-none"
            aria-live="polite"
        >
            <div
                className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl px-4 py-2 text-sm border backdrop-blur-sm ${
                    dark
                        ? "bg-slate-800/40 border-white/5 text-slate-300"
                        : "bg-white/60 border-slate-200 text-slate-600"
                }`}
                title="Selected cage: target sum, digits placed, what's left"
            >
                {body}
            </div>
        </div>
    );
}
