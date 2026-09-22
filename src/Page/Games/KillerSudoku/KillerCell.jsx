import React from "react";

/**
 * Single Killer Sudoku cell. Renders digit, cage sum label (top-left of cage),
 * notes, and cage-violation/selection styling. Memoized — the board re-renders
 * on every keystroke, so keep this component cheap.
 */
const KillerCell = React.memo(({
    r, c, val,
    isGiven, isWrong, isHint, isError, isSelected, isHighlight, isGuide,
    notes, themeColors, theme,
    onCellClick,
    win,
    isCageTopLeft, cageSum,
    cageWrong,
}) => {
    const thickBorderColor = themeColors.boardBorder;
    const thinBorderColor = theme === "dark" ? "#475569" : "#e2e8f0";
    const cageAccent = theme === "dark" ? "#38bdf8" : "#2563eb";

    const borderTop = r % 3 === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;
    const borderLeft = c % 3 === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;
    const borderRight = (c + 1) % 3 === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;
    const borderBottom = (r + 1) % 3 === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;

    let bgColor = themeColors.bg;
    if (isHint) bgColor = themeColors.hintBg;
    else if (isError || cageWrong) bgColor = themeColors.wrongCellBg;
    else if (isHighlight) bgColor = themeColors.numberHighlightBg;
    else if (isWrong) bgColor = themeColors.wrongCellBg;
    else if (isGuide) bgColor = themeColors.guideHighlightBg;
    else if (isGiven) bgColor = themeColors.lockedCellBg;

    let cellColor = isGiven
        ? themeColors.lockedCellTextColor
        : isWrong
            ? themeColors.wrongCellTextColor
            : isHint
                ? themeColors.hintTextColor
                : themeColors.numberBtnColor;

    const renderNotes = () => {
        if (val !== 0 || !notes || notes.size === 0) return null;
        return (
            <div
                style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gridTemplateRows: "repeat(3, 1fr)",
                    padding: "10%",
                    fontSize: "clamp(8px, 2.5vw, 12px)",
                    lineHeight: 1,
                }}
            >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                    const isNoteHighlight = highlightValue === n;
                    return (
                        <div
                            key={n}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: isNoteHighlight ? "bold" : "normal",
                                color: isNoteHighlight
                                    ? (theme === "dark" ? "#38bdf8" : "#2563eb")
                                    : themeColors.noteColor,
                            }}
                        >
                            {notes.has(n) ? n : ""}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            tabIndex={isGiven || win ? -1 : 0}
            onClick={() => !win && onCellClick(r, c)}
            style={{
                width: "100%",
                height: "100%",
                aspectRatio: "1 / 1",
                fontSize: "clamp(12px, 4vw, 24px)",
                fontWeight: isGiven ? "700" : "500",
                backgroundColor: bgColor,
                borderTop,
                borderLeft,
                borderRight,
                borderBottom,
                color: cellColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: win ? "default" : "pointer",
                outline: isSelected ? `3px solid ${themeColors.selectedCellBorder}` : "none",
                userSelect: "none",
                transition: "background-color 0s, box-shadow 0.25s",
                boxShadow: isHighlight
                    ? (theme === "dark" ? "0 0 0 3px #06b6d4" : "0 0 0 3px #facc15")
                    : isHint
                        ? `0 0 0 3px ${themeColors.hintBorder}`
                        : isError
                            ? "0 0 0 3px #ef4444"
                            : undefined,
                animation: isHint || isError ? "hintBlink 1s infinite" : undefined,
                position: "relative",
                boxSizing: "border-box",
            }}
            aria-selected={isSelected}
            title={isHint ? "Hint" : isError ? "Error" : undefined}
        >
            {isCageTopLeft && cageSum !== undefined && (
                <span
                    style={{
                        position: "absolute",
                        top: 1,
                        left: 3,
                        fontSize: "clamp(9px, 2.2vw, 13px)",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: cageAccent,
                        pointerEvents: "none",
                    }}
                >
                    {cageSum}
                </span>
            )}
            {val !== 0 ? val : (renderNotes() || "\u200B")}
        </div>
    );
});

export default KillerCell;
