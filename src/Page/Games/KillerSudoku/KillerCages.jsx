import React from "react";

/**
 * Renders Killer Sudoku cage outlines (dashed cyan borders) as an absolutely
 * positioned overlay matching the 9x9 grid exactly. Borders are drawn only on
 * cage-facing edges; shared edges between cells of the same cage stay open.
 *
 * Props:
 * - cages: [{ id, sum, cells, topLeft }]
 * - theme: "dark" | "light"
 */
export default function KillerCages({ cages, theme }) {
    if (!cages || cages.length === 0) return null;

    const cellPct = 100 / 9;
    const borderColor = theme === "dark" ? "rgba(56, 189, 248, 0.55)" : "rgba(37, 99, 235, 0.5)";
    const borderStyle = `2px dashed ${borderColor}`;

    return (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {cages.map((cage) => {
                const cellSet = new Set(cage.cells.map(([r, c]) => `${r}-${c}`));

                return cage.cells.map(([r, c]) => {
                    const left = c * cellPct;
                    const top = r * cellPct;
                    const hasTop = !cellSet.has(`${r - 1}-${c}`);
                    const hasBottom = !cellSet.has(`${r + 1}-${c}`);
                    const hasLeft = !cellSet.has(`${r}-${c - 1}`);
                    const hasRight = !cellSet.has(`${r}-${c + 1}`);

                    return (
                        <React.Fragment key={`${cage.id}-${r}-${c}`}>
                            {hasTop && <div style={{ position: "absolute", top: `${top}%`, left: `${left}%`, width: `${cellPct}%`, height: 0, borderTop: borderStyle }} />}
                            {hasBottom && <div style={{ position: "absolute", top: `${top + cellPct}%`, left: `${left}%`, width: `${cellPct}%`, height: 0, borderTop: borderStyle }} />}
                            {hasLeft && <div style={{ position: "absolute", top: `${top}%`, left: `${left}%`, width: 0, height: `${cellPct}%`, borderLeft: borderStyle }} />}
                            {hasRight && <div style={{ position: "absolute", top: `${top}%`, left: `${left + cellPct}%`, width: 0, height: `${cellPct}%`, borderLeft: borderStyle }} />}
                        </React.Fragment>
                    );
                });
            })}
        </div>
    );
}
