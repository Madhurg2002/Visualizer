import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useStockfish } from './useStockfish';
import { Activity, Brain, AlertTriangle } from 'lucide-react';

// Helper class for the Move Tree
class MoveNode {
    constructor(fen, move = null, parent = null) {
        this.fen = fen;
        this.move = move; // { from, to, san }
        this.parent = parent;
        this.children = [];
    }
}

const ChessGame = () => {
    // --- GAME STATE ---
    const [game, setGame] = useState(new Chess());
    const [gameStatus, setGameStatus] = useState('');
    const [fen, setFen] = useState(game.fen());
    const [optionSquares, setOptionSquares] = useState({});

    // --- ANALYSIS STATE ---
    const { engineStatus, bestMove, evaluation, evaluate } = useStockfish();
    const [isAnalysisOn, setIsAnalysisOn] = useState(true);
    const [depth, setDepth] = useState(10);
    const [hintArrow, setHintArrow] = useState([]); // [[from, to]]

    // --- TREE HISTORY ---
    const [rootNode, setRootNode] = useState(new MoveNode(new Chess().fen()));
    const [currentNode, setCurrentNode] = useState(rootNode);
    const [pgnInput, setPgnInput] = useState('');

    // --- VIEW STATE ---
    const [historyView, setHistoryView] = useState('list'); // 'list' | 'line'

    // --- EFFECTS ---

    // Game Status Check
    useEffect(() => {
        if (game.isCheckmate()) setGameStatus('Checkmate!');
        else if (game.isDraw()) setGameStatus('Draw!');
        else if (game.isGameOver()) setGameStatus('Game Over!');
        else setGameStatus('');
    }, [game, fen]);

    // Auto-Analyze on FEN change
    useEffect(() => {
        if (isAnalysisOn && engineStatus === 'ready') {
            evaluate(fen, depth);
        }
    }, [fen, isAnalysisOn, engineStatus, depth, evaluate]);

    // Update Hint Arrow when Best Move changes
    useEffect(() => {
        if (bestMove) {
            // bestMove is "e2e4". We need "e2", "e4"
            const from = bestMove.substring(0, 2);
            const to = bestMove.substring(2, 4);
            setHintArrow([[from, to]]);
        } else {
            setHintArrow([]);
        }
    }, [bestMove]);


    // --- MOVE LOGIC ---

    function onDrop(sourceSquare, targetSquare) {
        const gameCopy = new Chess(currentNode.fen);
        let move = null;
        try {
            move = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            });
        } catch (e) {
            move = null;
        }

        if (move === null) return false;

        const moveSan = move.san;
        const existingChild = currentNode.children.find(child => child.move && child.move.san === moveSan);

        if (existingChild) {
            // Promote this existing child to the main line (index 0) if it isn't already
            const index = currentNode.children.indexOf(existingChild);
            if (index > 0) {
                currentNode.children.splice(index, 1);
                currentNode.children.unshift(existingChild);
            }

            setCurrentNode(existingChild);
            setGame(new Chess(existingChild.fen));
            setFen(existingChild.fen);
        } else {
            const newNode = new MoveNode(gameCopy.fen(), move, currentNode);
            // Use unshift to make the new move the "main" line (index 0) so the UI follows it
            currentNode.children.unshift(newNode);
            setCurrentNode(newNode);
            setGame(gameCopy);
            setFen(gameCopy.fen());
        }

        setOptionSquares({});
        return true;
    }

    // --- HELPERS ---

    function onMouseOverSquare(square) {
        const moves = game.moves({ square: square, verbose: true });
        if (moves.length === 0) return;
        const newSquares = {};
        moves.map((move) => {
            newSquares[move.to] = {
                background: game.get(move.to) && game.get(move.to).color !== game.get(square).color
                    ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                    : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                borderRadius: '50%',
            };
            return move;
        });
        newSquares[square] = { background: 'rgba(255, 255, 0, 0.4)' };
        setOptionSquares(newSquares);
    }

    function resetGame() {
        const newGame = new Chess();
        const newRoot = new MoveNode(newGame.fen());
        setGame(newGame);
        setFen(newGame.fen());
        setGameStatus('');
        setRootNode(newRoot);
        setCurrentNode(newRoot);
        setPgnInput('');
    }

    function navigateHistory(direction) {
        if (direction === 'start') {
            setCurrentNode(rootNode);
            setGame(new Chess(rootNode.fen));
            setFen(rootNode.fen);
        } else if (direction === 'prev') {
            if (currentNode.parent) {
                setCurrentNode(currentNode.parent);
                setGame(new Chess(currentNode.parent.fen));
                setFen(currentNode.parent.fen);
            }
        } else if (direction === 'next') {
            if (currentNode.children.length > 0) {
                const nextNode = currentNode.children[0];
                setCurrentNode(nextNode);
                setGame(new Chess(nextNode.fen));
                setFen(nextNode.fen);
            }
        } else if (direction === 'end') {
            let ptr = currentNode;
            while (ptr.children.length > 0) ptr = ptr.children[0];
            if (ptr !== currentNode) {
                setCurrentNode(ptr);
                setGame(new Chess(ptr.fen));
                setFen(ptr.fen);
            }
        }
    }

    // --- EVALUATION FORMATTER ---
    const getEvalDisplay = () => {
        if (!evaluation) return { text: '...', width: '50%', color: 'bg-slate-500' };

        let score = 0;
        let text = '';
        const sideToMove = game.turn() === 'w' ? 1 : -1;

        if (evaluation.type === 'mate') {
            score = evaluation.value > 0 ? 100 : -100; // Force max bar
            text = `M${Math.abs(evaluation.value)}`;
        } else {
            // Stockfish cp score is relative to side to move
            // We want White Advantage (+).
            // If Text is "score cp 50" and turn is White -> +0.5
            // If Text is "score cp 50" and turn is Black -> Black is winning by 0.5 (so -0.5 for White)
            // Wait, standard UCI `score cp` is from engine's perspective (side to move).

            const rawCp = evaluation.value;
            const whiteCp = rawCp * sideToMove;

            text = (whiteCp / 100).toFixed(2);
            // Height logic: Clamp -5 to +5 maps to 0% to 100%
            score = Math.max(Math.min(whiteCp / 100, 5), -5); // Range -5 to 5
        }

        // Logic for Bar Height (White Advantage = Higher)
        // 0 = 50%. +5 = 100%. -5 = 0%.
        // Percentage = (Score + 5) / 10 * 100
        const percentage = evaluation.type === 'mate'
            ? (evaluation.value * sideToMove > 0 ? 100 : 0) // White Mate = 100%, Black Mate = 0%
            : ((score + 5) / 10) * 100;

        return {
            text: text,
            whiteHeight: `${percentage}%`,
            color: evaluation.type === 'mate' ? 'bg-rose-500' : 'bg-white'
        };
    };

    const evalData = getEvalDisplay();

    return (
        <div className="flex flex-col xl:flex-row items-center justify-center min-h-[calc(100vh-4rem)] p-4 gap-8 max-w-[1600px] mx-auto">

            {/* LEFT COLUMN: Evaluation & Board */}
            <div className="flex gap-4 h-[600px]">

                {/* Eval Bar */}
                <div className="w-12 bg-slate-700 rounded-full overflow-hidden flex flex-col-reverse shadow-2xl relative border border-slate-600">
                    <div
                        className={`w-full transition-all duration-1000 ease-in-out ${evalData.color}`}
                        style={{ height: evalData.whiteHeight }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-difference">
                        <span className="text-xs font-bold text-gray-400 rotate-90">{evalData.text}</span>
                    </div>
                </div>

                {/* Board */}
                <div className="w-[600px] aspect-square shadow-2xl rounded-xl overflow-hidden border-8 border-slate-700 bg-slate-900 shadow-blue-500/20">
                    <Chessboard
                        position={fen}
                        onPieceDrop={onDrop}
                        onMouseOverSquare={onMouseOverSquare}
                        customArrows={hintArrow}
                        customDarkSquareStyle={{ backgroundColor: '#779556' }}
                        customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                        customSquareStyles={optionSquares}
                        animationDuration={200}
                    />
                </div>
            </div>

            {/* RIGHT COLUMN: Controls & Analysis */}
            <div className="flex flex-col w-full max-w-[500px] h-[600px] gap-4">

                {/* Info Card */}
                <div className="bg-slate-900/80 backdrop-blur border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            Chess AI
                        </h1>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${engineStatus === 'ready' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'}`}>
                            {engineStatus === 'ready' ? 'ENGINE READY' : 'LOADING...'}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 bg-slate-800 rounded-xl p-3 border border-white/5">
                            <label className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                <span className="flex items-center gap-2"><Brain size={14} /> DEPTH</span>
                                <span>{depth}</span>
                            </label>
                            <input
                                type="range" min="1" max="20" step="1"
                                value={depth}
                                onChange={(e) => setDepth(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <button
                            onClick={() => setIsAnalysisOn(!isAnalysisOn)}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${isAnalysisOn ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            <Activity size={18} />
                            {isAnalysisOn ? 'Analysis ON' : 'Analysis OFF'}
                        </button>

                        <button
                            onClick={resetGame}
                            className="flex items-center justify-center gap-2 py-3 bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/30 rounded-xl font-bold transition-all"
                        >
                            <AlertTriangle size={18} />
                            Reset
                        </button>
                    </div>

                    {/* Best Move Display */}
                    {bestMove && isAnalysisOn && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
                            <span className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Best Move</span>
                            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">{bestMove}</span>
                        </div>
                    )}
                </div>

                {/* Move History / Tree */}
                <div className="flex-grow bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-0">
                    <div className="px-4 py-3 bg-white/5 border-b border-white/5 font-bold text-sm text-slate-400 flex justify-between items-center">
                        <span>MOVE HISTORY</span>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-1 bg-slate-800 rounded p-0.5">
                                <button
                                    onClick={() => setHistoryView('list')}
                                    className={`p-1 rounded ${historyView === 'list' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-white'}`}
                                    title="List View"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                </button>
                                <button
                                    onClick={() => setHistoryView('line')}
                                    className={`p-1 rounded ${historyView === 'line' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-white'}`}
                                    title="Line View"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => navigateHistory('start')} className="hover:text-white">&lt;&lt;</button>
                                <button onClick={() => navigateHistory('prev')} className="hover:text-white">&lt;</button>
                                <button onClick={() => navigateHistory('next')} className="hover:text-white">&gt;</button>
                                <button onClick={() => navigateHistory('end')} className="hover:text-white">&gt;&gt;</button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 text-sm font-mono leading-relaxed space-y-1">
                        {
                            historyView === 'list'
                                ? <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    {rootNode.children.length > 0 && renderHistoryList(rootNode, currentNode, setCurrentNode, setGame, setFen)}
                                </div>
                                : <div className="flex flex-wrap gap-x-1 content-start leading-6">
                                    {rootNode.children.length > 0 && renderHistoryLine(rootNode, currentNode, setCurrentNode, setGame, setFen)}
                                </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple flat list renderer helper (just Main Line)
const renderHistoryList = (node, current, setCurrent, setGame, setFen) => {
    // Traverse down main line
    let moves = [];
    let ptr = node;
    while (ptr.children.length > 0) {
        moves.push(ptr.children[0]);
        ptr = ptr.children[0];
    }

    // Group by pairs
    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
        pairs.push({
            white: moves[i],
            black: moves[i + 1] || null
        });
    }

    return pairs.map((pair, idx) => (
        <React.Fragment key={idx}>
            <div className="text-slate-500 text-right pr-2 flex items-center justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
            </div>
            <div className="flex gap-4">
                <span
                    className={`cursor-pointer px-1 rounded ${pair.white === current ? 'bg-yellow-500 text-black' : 'hover:bg-slate-700 text-slate-300'}`}
                    onClick={() => {
                        setCurrent(pair.white);
                        setGame(new Chess(pair.white.fen));
                        setFen(pair.white.fen);
                    }}
                >
                    {pair.white.move.san}
                </span>
                {pair.black && (
                    <span
                        className={`cursor-pointer px-1 rounded ${pair.black === current ? 'bg-yellow-500 text-black' : 'hover:bg-slate-700 text-slate-300'}`}
                        onClick={() => {
                            setCurrent(pair.black);
                            setGame(new Chess(pair.black.fen));
                            setFen(pair.black.fen);
                        }}
                    >
                        {pair.black.move.san}
                    </span>
                )}
            </div>
        </React.Fragment>
    ));
};

const renderHistoryLine = (node, current, setCurrent, setGame, setFen) => {
    let elements = [];
    let ptr = node;
    let moveCount = 1;

    while (ptr.children.length > 0) {
        const child = ptr.children[0]; // Main line only
        const isWhite = child.move.color === 'w';

        // Add Move Number for White
        if (isWhite) {
            elements.push(<span key={`num-${moveCount}`} className="text-slate-500 ml-2 first:ml-0Select">{moveCount}.</span>);
            moveCount++;
        }

        // Add Move
        elements.push(
            <span
                key={child.fen}
                onClick={() => {
                    setCurrent(child);
                    setGame(new Chess(child.fen));
                    setFen(child.fen);
                }}
                className={`cursor-pointer px-1 rounded mx-0.5 ${child === current ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-slate-700 text-slate-300'}`}
            >
                {child.move.san}
            </span>
        );

        ptr = child;
    }
    return elements;
};

export default ChessGame;


