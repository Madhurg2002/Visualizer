import React, { useMemo } from "react";
import KillerCell from "./KillerCell";
import KillerCages from "./KillerCages";

/**
 * Killer Sudoku board: 9x9 grid + dashed cage overlay + sum labels.
 * Selection model:
 *  - selected cell: strong ring
 *  - row/col guide highlight (existing)
 *  - NEW: peer cage highlight — all cells of the selected cell's cage get a
 *    subtle tint so you can see the cage shape you're working in.
 *  - NEW: fully-and-correctly placed cages get a faint "done" tint.
 */
export default function KillerBoard({
    board,
    givens,
    isWrong,
    hintCell,
    errorCell,
    userEditedAfterHint,
    selected,
    onCellClick,
    win,
    themeColors,
    theme,
    highlightValue,
    highlightGuides,
    notes,
    cages,
    cageIdOf,
    cageWrongCells,
}) {
    const { sums, topCells, activeCageCells, doneCageCells, cageProgress } = useMemo(() => {
        const sums = {};
        const topCells = new Set();
        const activeCageCells = new Set();
        const doneCageCells = new Set();
        const cageProgress = {}; // cageId -> { filled, size, ok }
        (cages || []).forEach((cage) => {
            sums[cage.id] = cage.sum;
            if (cage.topLeft) topCells.add(`${cage.topLeft[0]}-${cage.topLeft[1]}`);
            let filled = 0, sumOk = 0;
            for (const [r, c] of cage.cells) {
                const v = board[r] ? board[r][c] : 0;
                if (v !== 0) { filled++; sumOk += v; }
            }
            const complete = filled === cage.cells.length && sumOk === cage.sum;
            cageProgress[cage.id] = { filled, size: cage.cells.length, ok: complete };
            if (complete) doneCageCells.add(cage.id);
        });
        if (selected && cageIdOf) {
            const id = cageIdOf[selected[0]] ? cageIdOf[selected[0]][selected[1]] : -1;
            if (id >= 0) {
                (cages || []).forEach((cage) => {
                    if (cage.id === id) cage.cells.forEach(([r, c]) => activeCageCells.add(`${r}-${c}`));
                });
            }
        }
        return { sums, topCells, activeCageCells, doneCageCells, cageProgress };
    }, [cages, board, selected, cageIdOf]);

    return (
        <div
            style={{
                margin: "0 auto 28px auto",
                display: "grid",
                gridTemplateColumns: "repeat(9, 1fr)",
                userSelect: "none",
                borderRadius: 14,
                overflow: "hidden",
                width: "100%",
                maxWidth: 500,
                background: themeColors.boardBg,
                boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.12)",
                border: `4px solid ${themeColors.boardBorder}`,
                aspectRatio: "1/1",
                position: "relative",
            }}
        >
            {board.flat().map((val, i) => {
                const r = Math.floor(i / 9);
                const c = i % 9;
                const key = `${r}-${c}`;
                const isGiven = givens.has(key);
                const wrong = isWrong.has(key);
                const isHint = hintCell === key && !userEditedAfterHint.current;
                const isError = errorCell === key && !userEditedAfterHint.current;
                const isSelected = selected && r === selected[0] && c === selected[1];
                const isHighlight = highlightValue && val === highlightValue && val !== 0;
                const isGuide = highlightGuides && selected && (r === selected[0] || c === selected[1] ||
                    (Math.floor(r / 3) === Math.floor(selected[0] / 3) && Math.floor(c / 3) === Math.floor(selected[1] / 3)));
                const cellNotes = notes ? notes[key] : null;
                const cageId = cageIdOf ? cageIdOf[r][c] : -1;

                return (
                    <KillerCell
                        key={key}
                        r={r}
                        c={c}
                        val={val}
                        isGiven={isGiven}
                        isWrong={wrong}
                        isHint={isHint}
                        isError={isError}
                        isSelected={isSelected}
                        isHighlight={isHighlight}
                        isGuide={isGuide}
                        isCagePeer={activeCageCells.has(key) && !isSelected}
                        isCageDone={cageId >= 0 && doneCageCells.has(cageId)}
                        notes={cellNotes}
                        highlightValue={highlightValue}
                        themeColors={themeColors}
                        theme={theme}
                        onCellClick={onCellClick}
                        win={win}
                        isCageTopLeft={topCells.has(key)}
                        cageSum={cageId >= 0 ? sums[cageId] : undefined}
                        cageProgress={cageId >= 0 ? cageProgress[cageId] : undefined}
                        cageWrong={cageWrongCells.has(key)}
                    />
                );
            })}
            <KillerCages cages={cages} theme={theme} activeCageId={selected && cageIdOf ? cageIdOf[selected[0]][selected[1]] : -1} />
        </div>
    );
}
