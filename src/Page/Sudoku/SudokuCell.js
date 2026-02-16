import React from "react";

const SudokuCell = React.memo(({
    r, c, val,
    isLocked, isWrong, isHint, isSelected, isHighlight,
    notes,
    themeColors, theme,
    onCellClick,
    win,
    size = 3,
    highlightValue 
}) => {
    // Styles
    const thickBorderColor = themeColors.boardBorder;
    const thinBorderColor = theme === "dark" ? "#475569" : "#ddd";

    const borderTop = r % size === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;
    const borderLeft = c % size === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;
    const borderRight = (c + 1) % size === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;
    const borderBottom = (r + 1) % size === 0 ? `3px solid ${thickBorderColor}` : `1px solid ${thinBorderColor}`;

    const isBoxEdge = r % size === 0 || (r + 1) % size === 0 || c % size === 0 || (c + 1) % size === 0;
    const boxShadow = isBoxEdge ? `0 0 8px ${thickBorderColor}` : undefined;

    const boxShaded = (Math.floor(r / size) + Math.floor(c / size)) % 2 === 0;

    let bgColor = themeColors.bg;
    if (isHint) bgColor = themeColors.hintBg;
    else if (isHighlight) bgColor = themeColors.numberHighlightBg;
    else if (isWrong) bgColor = themeColors.wrongCellBg;
    else if (isLocked) bgColor = themeColors.lockedCellBg;
    else if (val !== 0) bgColor = themeColors.normalCellBg;

    // if (theme === "dark" && boxShaded && !isHint && !isHighlight && !isWrong && !isLocked) {
    //     bgColor = "#2f3b55"; // subtle alternate dark shading
    // }

    let cellColor = isLocked
        ? themeColors.lockedCellTextColor
        : isWrong
            ? themeColors.wrongCellTextColor
            : isHint
                ? themeColors.hintTextColor
                : themeColors.numberBtnColor;

    // Notes rendering
    const renderNotes = () => {
        if (val !== 0 || !notes || notes.size === 0) return null;
        
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                width: '100%',
                height: '100%',
                fontSize: 8,
                lineHeight: 1,
                color: theme === 'dark' ? '#94a3b8' : '#64748b'
            }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
                    const isNoteHighlight = highlightValue === n;
                    return (
                        <div key={n} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: isNoteHighlight ? 'bold' : 'normal',
                            color: isNoteHighlight 
                                ? (theme === 'dark' ? '#38bdf8' : '#2563eb') // Blue-500/Sky-400
                                : (theme === 'dark' ? '#94a3b8' : '#64748b') 
                        }}>
                            {notes.has(n) ? n : ''}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <td
            tabIndex={isLocked || win ? -1 : 0}
            onClick={() => !win && onCellClick(r, c)}
            style={{
                aspectRatio: "1 / 1",
                fontSize: "clamp(12px, 4vw, 24px)",
                fontWeight: isLocked ? "700" : isHint ? "900" : "500",
                backgroundColor: bgColor,
                borderTop,
                borderLeft,
                borderRight,
                borderBottom,
                color: cellColor,
                textAlign: "center",
                verticalAlign: "middle",
                cursor: win ? "default" : "pointer",
                outline: isSelected ? `3px solid ${themeColors.selectedCellBorder}` : "none",
                userSelect: "none",
                transition: "background-color 0s, box-shadow 0.25s, outline-color 0s", // Removed bg transition for snappier feel
                boxShadow:
                    isHighlight
                        ? (theme === "dark" ? "0 0 0 3px #06b6d4" : "0 0 0 3px #facc15") // Cyan for dark, Yellow for light
                        : isHint
                            ? `0 0 0 3px ${themeColors.hintBorder}`
                            : boxShadow,
                animation: isHint ? "hintBlink 1s infinite" : undefined,
                position: 'relative'
            }}
            aria-selected={isSelected}
            title={isHint ? "Hint" : undefined}
        >
            {val !== 0 ? (isHint ? val : val) : renderNotes()}
        </td>
    );
});

export default SudokuCell;
