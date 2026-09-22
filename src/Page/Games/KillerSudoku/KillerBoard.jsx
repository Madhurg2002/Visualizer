import React, { useMemo } from "react";
import KillerCell from "./KillerCell";
import KillerCages from "./KillerCages";

/**
 * Killer Sudoku board: 9x9 grid + dashed cage overlay + sum labels.
 * Same layout skeleton as the classic Sudoku board for UI consistency.
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
    const cageSums = useMemo(() => {
        const sums = {};
        const topCells = new Set();
        (cages || []).forEach((cage) => {
            sums[cage.id] = cage.sum;
            if (cage.topLeft) topCells.add(`${cage.topLeft[0]}-${cage.topLeft[1]}`);
        });
        return { sums, topCells };
    }, [cages]);

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
                const isGuide = highlightGuides && selected && (r === selected[0] || c === selected[1]);
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
                        notes={cellNotes}
                        highlightValue={highlightValue}
                        themeColors={themeColors}
                        theme={theme}
                        onCellClick={onCellClick}
                        win={win}
                        isCageTopLeft={cageSums.topCells.has(key)}
                        cageSum={cageId >= 0 ? cageSums.sums[cageId] : undefined}
                        cageWrong={cageWrongCells.has(key)}
                    />
                );
            })}
            <KillerCages cages={cages} theme={theme} />
        </div>
    );
}
