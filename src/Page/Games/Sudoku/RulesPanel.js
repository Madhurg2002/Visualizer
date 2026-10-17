// src/Page/Games/Sudoku/RulesPanel.js
import React, { useState } from "react";
import { Grid3x3, X } from "lucide-react";

const STORAGE_KEY = "sudokuRulesDismissed";

/**
 * Rules callout for classic Sudoku.
 * - Default: visible until dismissed (remembered in localStorage).
 * - forceOpen=true: always visible until onClose is called (header "?" button / ?rules=1).
 */
export default function RulesPanel({ forceOpen = false, onClose }) {
    const [dismissed, setDismissed] = useState(
        () => localStorage.getItem(STORAGE_KEY) === "true"
    );

    const visible = forceOpen || !dismissed;
    if (!visible) return null;

    const dismiss = () => {
        if (forceOpen) {
            onClose && onClose();
            return;
        }
        localStorage.setItem(STORAGE_KEY, "true");
        setDismissed(true);
    };

    return (
        <div className="w-full max-w-[560px] px-4 mb-3">
            <div className="relative bg-amber-500/10 border border-amber-400/25 rounded-2xl p-4 pr-10 text-sm text-slate-300 backdrop-blur-sm">
                <button
                    onClick={dismiss}
                    className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title={forceOpen ? "Close rules" : "Dismiss rules"}
                    aria-label={forceOpen ? "Close rules" : "Dismiss rules"}
                >
                    <X size={16} />
                </button>
                <h3 className="flex items-center gap-2 font-bold text-amber-300 mb-1.5">
                    <Grid3x3 size={16} /> How to play Sudoku
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>
                        Fill the grid so every row, column and 3×3 box contains the digits
                        1–9 exactly once.
                    </li>
                    <li>
                        Click a cell, then pick a number — or toggle{" "}
                        <span className="text-amber-300 font-semibold">Notes</span> (shortcut N)
                        to pencil in candidates.
                    </li>
                    <li>
                        <span className="text-amber-300 font-semibold">Hint</span> reveals a
                        logically forced cell when one exists;{" "}
                        <span className="text-amber-300 font-semibold">Check</span> flags mistakes.
                    </li>
                    <li>
                        The <span className="text-amber-300 font-semibold">Solver</span> replays
                        the solution step-by-step — pick Logic Only to see the human techniques.
                    </li>
                    <li>
                        Seeds are shareable: the same seed always rebuilds the same puzzle. Try
                        the <span className="text-amber-300 font-semibold">Daily</span> puzzle for
                        a everyone-today challenge.
                    </li>
                </ul>
            </div>
        </div>
    );
}
