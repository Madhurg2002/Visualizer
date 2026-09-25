// src/Page/Games/KillerSudoku/Controls.js
import React from "react";
import { Undo2, CheckCircle2, Lightbulb, RefreshCw, Settings2, Skull, Cpu, Pencil, ChevronDown, Brain, Zap } from "lucide-react";
import { SOLVER_METHODS } from "../Sudoku/Controls";

export default function Controls({
    difficulty,
    seedInput,
    setSeedInput,
    currentSeed,
    onApplySeed,
    onRandomize,
    onDifficultyChange,
    onUndo,
    undoDisabled,
    onCheck,
    checkDisabled,
    onHint,
    onVisualizeSolver,
    solving,
    solverMethod = "logic",
    setSolverMethod,
    isNoteMode,
    onToggleNoteMode,
    poppedButton,
    handleButtonClick,
    theme,
    themeColors,
}) {
    const [methodOpen, setMethodOpen] = React.useState(false);
    const methodRef = React.useRef(null);

    React.useEffect(() => {
        if (!methodOpen) return;
        const onDown = (e) => {
            if (methodRef.current && !methodRef.current.contains(e.target)) setMethodOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [methodOpen]);

    const activeMethod = SOLVER_METHODS.find((m) => m.id === solverMethod) || SOLVER_METHODS[0];
    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C15]";

    const baseButtonStyle = {
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        border: "none",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: theme === "dark" ? "0 4px 6px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.1)",
        outline: "none",
        transition: "all 0.2s ease",
    };

    const labelColor = theme === "dark" ? "#cbd5e1" : "#475569";
    const inputColor = theme === "dark" ? "#f8fafc" : "#0f172a";

    return (
        <div className="w-full max-w-2xl px-4 flex flex-col items-center gap-4 mb-4">
            {/* Configuration Row: Seed & Difficulty */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-800/20 p-3 rounded-2xl backdrop-blur-sm border border-white/5">
                <label
                    style={{ fontWeight: 600, color: labelColor, display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}
                    title="Puzzle seed — same seed always yields the same cages (share it!)"
                >
                    Seed:
                    <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/10 focus-within:border-cyan-500/50 transition-colors">
                        <input
                            type="text"
                            value={seedInput}
                            onChange={(e) => setSeedInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onApplySeed()}
                            placeholder="Enter seed"
                            className={focusRing}
                            title="Enter a custom puzzle seed"
                            style={{
                                fontFamily: "monospace",
                                padding: "4px 8px",
                                width: 100,
                                background: "transparent",
                                color: inputColor,
                                border: "none",
                                fontSize: 14,
                            }}
                        />
                        {seedInput !== currentSeed && (
                            <button
                                onClick={onApplySeed}
                                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-3 py-1 rounded text-xs font-bold transition-colors"
                                title="Load puzzle from this seed"
                            >
                                GO
                            </button>
                        )}
                    </div>
                </label>

                <div className="h-6 w-px bg-white/10 hidden sm:block" />

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => handleButtonClick("new", onRandomize)}
                        style={{
                            ...baseButtonStyle,
                            backgroundColor: poppedButton === "new" ? "#0e7490" : (theme === "dark" ? "#334155" : "#e2e8f0"),
                            color: theme === "dark" ? "#f8fafc" : "#0f172a",
                            transform: poppedButton === "new" ? "scale(0.95)" : "scale(1)",
                            flex: 1,
                        }}
                        title="Generate a random Killer puzzle (same seed = same cages)"
                        className={focusRing}
                    >
                        <RefreshCw size={16} className={poppedButton === "new" ? "animate-spin-fast" : ""} />
                        Random
                    </button>

                    <button
                        onClick={onDifficultyChange}
                        style={{
                            ...baseButtonStyle,
                            backgroundColor: "transparent",
                            color:
                                difficulty === "extreme" ? "#ef4444"
                                    : difficulty === "hard" ? "#f59e0b"
                                        : difficulty === "medium" ? "#3b82f6"
                                            : "#22c55e",
                            border: `1px solid ${
                                difficulty === "extreme" ? "#ef444450"
                                    : difficulty === "hard" ? "#f59e0b50"
                                        : difficulty === "medium" ? "#3b82f650"
                                            : "#22c55e50"
                            }`,
                            minWidth: 100,
                            flex: 1,
                        }}
                        className={`hover:bg-white/5 ${focusRing}`}
                        title="Cycle through difficulty levels (bigger cages = harder)"
                    >
                        <Settings2 size={16} />
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </button>
                </div>
            </div>

            {/* Action Row: Undo, Notes, Check, Hint, Solver */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
                <button
                    onClick={() => handleButtonClick("undo", onUndo)}
                    disabled={undoDisabled}
                    style={{
                        ...baseButtonStyle,
                        backgroundColor: theme === "dark" ? "#1e293b" : "#f1f5f9",
                        color: theme === "dark" ? "#cbd5e1" : "#475569",
                        opacity: undoDisabled ? 0.4 : 1,
                        cursor: undoDisabled ? "default" : "pointer",
                        transform: poppedButton === "undo" ? "scale(0.95)" : "scale(1)",
                        border: theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1",
                    }}
                    className={`${!undoDisabled ? "hover:bg-slate-700/50 hover:border-slate-500/50" : ""} ${focusRing}`}
                    title="Undo your last move"
                >
                    <Undo2 size={18} />
                </button>

                <button
                    onClick={onToggleNoteMode}
                    style={{
                        ...baseButtonStyle,
                        backgroundColor: isNoteMode ? "#4f46e5" : (theme === "dark" ? "#1e293b" : "#f1f5f9"),
                        color: isNoteMode ? "#ffffff" : (theme === "dark" ? "#cbd5e1" : "#475569"),
                        transform: isNoteMode ? "scale(1.05)" : "scale(1)",
                        border: isNoteMode ? "1px solid #6366f1" : (theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1"),
                        boxShadow: isNoteMode ? "0 0 15px rgba(79,70,229,0.3)" : "none",
                    }}
                    className={`${!isNoteMode ? "hover:bg-slate-700/50 hover:border-slate-500/50" : ""} ${focusRing}`}
                    title="Toggle Notes mode (Keyboard shortcut: N)"
                >
                    <Pencil size={18} />
                </button>

                <button
                    onClick={() => handleButtonClick("check", onCheck)}
                    disabled={checkDisabled}
                    style={{
                        ...baseButtonStyle,
                        backgroundColor: theme === "dark" ? "#14532d" : "#dcfce7",
                        color: theme === "dark" ? "#86efac" : "#166534",
                        opacity: checkDisabled ? 0.4 : 1,
                        cursor: checkDisabled ? "default" : "pointer",
                        transform: poppedButton === "check" ? "scale(0.95)" : "scale(1)",
                        border: theme === "dark" ? "1px solid #166534" : "1px solid #86efac",
                    }}
                    className={`${!checkDisabled ? "hover:bg-green-900/80 hover:border-green-500/50" : ""} ${focusRing}`}
                    title="Check the board for mistakes (sudoku + cage rules)"
                >
                    <CheckCircle2 size={18} />
                </button>

                <button
                    onClick={() => handleButtonClick("hint", onHint)}
                    style={{
                        ...baseButtonStyle,
                        backgroundColor: theme === "dark" ? "#78350f" : "#fef3c7",
                        color: theme === "dark" ? "#fcd34d" : "#b45309",
                        transform: poppedButton === "hint" ? "scale(0.95)" : "scale(1)",
                        border: theme === "dark" ? "1px solid #92400e" : "1px solid #fcd34d",
                    }}
                    className={`hover:bg-amber-900/80 hover:border-amber-500/50 ${focusRing}`}
                    title="Show a hint"
                >
                    <Lightbulb size={18} />
                </button>

                {/* Solver: method picker + run button */}
                <div className="flex" style={{ position: "relative" }} ref={methodRef}>
                    <button
                        onClick={() => handleButtonClick("solver", onVisualizeSolver)}
                        disabled={solving}
                        style={{
                            ...baseButtonStyle,
                            backgroundColor: theme === "dark" ? "#4c1d95" : "#ede9fe",
                            color: theme === "dark" ? "#c4b5fd" : "#5b21b6",
                            opacity: solving ? 0.6 : 1,
                            cursor: solving ? "default" : "pointer",
                            transform: poppedButton === "solver" ? "scale(0.95)" : "scale(1)",
                            border: theme === "dark" ? "1px solid #6d28d9" : "1px solid #a78bfa",
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                        }}
                        className={`hover:bg-violet-900/60 hover:border-violet-500/50 ${focusRing}`}
                        title={`${activeMethod.hint} (replay animated)`}
                    >
                        <activeMethod.icon size={18} />
                        {activeMethod.label}
                    </button>
                    <button
                        onClick={() => setMethodOpen((v) => !v)}
                        aria-expanded={methodOpen}
                        style={{
                            ...baseButtonStyle,
                            padding: "10px 8px",
                            backgroundColor: theme === "dark" ? "#4c1d95" : "#ede9fe",
                            color: theme === "dark" ? "#c4b5fd" : "#5b21b6",
                            cursor: "pointer",
                            border: theme === "dark" ? "1px solid #6d28d9" : "1px solid #a78bfa",
                            borderLeft: "none",
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                        }}
                        className={`${focusRing}`}
                        title="Choose solver method"
                    >
                        <ChevronDown size={14} />
                    </button>
                    {methodOpen && (
                        <div style={{
                            position: "absolute",
                            top: "110%",
                            right: 0,
                            zIndex: 100,
                            minWidth: 230,
                            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                            border: theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0",
                            borderRadius: 12,
                            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                            overflow: "hidden",
                        }}>
                            {SOLVER_METHODS.map((m) => {
                                const Icon = m.icon;
                                const active = m.id === solverMethod;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => { setSolverMethod(m.id); setMethodOpen(false); }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            width: "100%",
                                            padding: "10px 14px",
                                            background: active ? (theme === "dark" ? "#334155" : "#e2e8f0") : "transparent",
                                            color: active ? (theme === "dark" ? "#f8fafc" : "#0f172a") : (theme === "dark" ? "#cbd5e1" : "#334155"),
                                            border: "none",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            fontSize: 14,
                                            fontWeight: 600,
                                        }}
                                    >
                                        <Icon size={16} />
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
