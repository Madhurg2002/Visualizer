// src/Page/Games/KillerSudoku/RulesPanel.js
import React, { useState } from "react";
import { Skull, X } from "lucide-react";

const STORAGE_KEY = "killerSudokuRulesDismissed";

/**
 * Rules callout for Killer Sudoku.
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
            <div className="relative bg-cyan-500/10 border border-cyan-400/25 rounded-2xl p-4 pr-10 text-sm text-slate-300 backdrop-blur-sm">
                <button
                    onClick={dismiss}
                    className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title={forceOpen ? "Close rules" : "Dismiss rules"}
                    aria-label={forceOpen ? "Close rules" : "Dismiss rules"}
                >
                    <X size={16} />
                </button>
                <h3 className="flex items-center gap-2 font-bold text-cyan-300 mb-1.5">
                    <Skull size={16} /> Killer Sudoku rules
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>
                        Standard Sudoku rules apply: rows, columns and 3x3 boxes must contain
                        digits 1–9 exactly once.
                    </li>
                    <li>
                        <span className="text-cyan-300 font-semibold">No givens.</span> Dashed{" "}
                        <span className="text-cyan-300 font-semibold">cages</span> show a sum in their
                        top-left corner — the digits inside must add up to it.
                    </li>
                    <li>A digit may never repeat within a cage.</li>
                    <li>
                        Bigger difficulty → bigger cages → fewer clues. Every puzzle has exactly
                        one solution.
                    </li>
                </ul>
            </div>
        </div>
    );
}
