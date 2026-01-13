import { useState, useEffect, useRef, useCallback } from 'react';

const STOCKFISH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';

export const useStockfish = () => {
    const worker = useRef(null);
    const [engineStatus, setEngineStatus] = useState('loading'); // loading, ready, analyzing, error
    const [bestMove, setBestMove] = useState(null);
    const [evaluation, setEvaluation] = useState(null);

    useEffect(() => {
        // Load Stockfish from CDN
        let isMounted = true;

        const loadEngine = async () => {
            try {
                // Dynamically fetch the script text
                const response = await fetch(STOCKFISH_URL);
                if (!response.ok) throw new Error('Failed to fetch Stockfish');
                const scriptText = await response.text();

                // Create a Blob from the script content
                const blob = new Blob([scriptText], { type: 'application/javascript' });
                const workerUrl = URL.createObjectURL(blob);

                worker.current = new Worker(workerUrl);

                worker.current.onmessage = (e) => {
                    const msg = e.data;

                    if (msg === 'uciok') {
                        if (isMounted) setEngineStatus('ready');
                    }

                    // Parse Evaluation & PV (Real-time update)
                    // "info depth 10 seldepth 14 multipv 1 score cp 35 ... pv e2e4 e7e5"
                    if (msg.startsWith('info depth')) {
                        const scoreMatch = msg.match(/score cp (-?\d+)/);
                        const mateMatch = msg.match(/score mate (-?\d+)/);
                        const pvMatch = msg.match(/ pv ([a-h1-8]{4,5})/); // Capture first move of PV

                        if (scoreMatch) {
                            const cp = parseInt(scoreMatch[1], 10);
                            if (isMounted) setEvaluation({ type: 'cp', value: cp });
                        } else if (mateMatch) {
                            const mate = parseInt(mateMatch[1], 10);
                            if (isMounted) setEvaluation({ type: 'mate', value: mate });
                        }

                        // Update best move immediately from PV if available
                        if (pvMatch && isMounted) {
                            setBestMove(pvMatch[1]);
                        }
                    }

                    // Final Best Move
                    if (msg.startsWith('bestmove')) {
                        const parts = msg.split(' ');
                        const move = parts[1];
                        if (isMounted) setBestMove(move);
                    }
                };

                // Initialize UCI and set Lower Memory
                worker.current.postMessage('uci');
                worker.current.postMessage('setoption name Hash value 32'); // Limit Hash to 32MB
                worker.current.postMessage('isready');

            } catch (err) {
                console.error("Stockfish Load Error", err);
                if (isMounted) setEngineStatus('error');
            }
        };

        if (!worker.current) loadEngine();

        return () => {
            isMounted = false;
            if (worker.current) {
                worker.current.terminate(); // Terminate to free memory
                worker.current = null;
            }
        };
    }, []);

    const evaluate = useCallback((fen, depth = 10) => {
        if (!worker.current) return;

        // Do NOT reset bestMove here if we want to show it building up, 
        // but typically we do want to clear it for a new position.
        // setBestMove(null); 
        // setEvaluation(null);

        // Stop any previous calculation
        worker.current.postMessage('stop');

        // Allow a slight delay for stop to process if needed, or just send valid commands
        worker.current.postMessage(`position fen ${fen}`);
        worker.current.postMessage(`go depth ${depth}`);
    }, []);

    // Update parsing logic to capture PV (current best move)
    useEffect(() => {
        if (!worker.current) return;

        const originalOnMessage = worker.current.onmessage;
        worker.current.onmessage = (e) => {
            const msg = e.data;

            if (msg === 'uciok') {
                setEngineStatus('ready');
            }

            // Parse Evaluation & PV
            // "info depth 10 ... score cp 35 ... pv e2e4 e7e5"
            if (msg.startsWith('info depth')) {
                const scoreMatch = msg.match(/score cp (-?\d+)/);
                const mateMatch = msg.match(/score mate (-?\d+)/);
                const pvMatch = msg.match(/ pv ([a-h1-8]{4,5})/); // Match first move in PV

                if (scoreMatch) {
                    const cp = parseInt(scoreMatch[1], 10);
                    setEvaluation({ type: 'cp', value: cp });
                } else if (mateMatch) {
                    const mate = parseInt(mateMatch[1], 10);
                    setEvaluation({ type: 'mate', value: mate });
                }

                // Update best move immediately from PV
                if (pvMatch) {
                    setBestMove(pvMatch[1]);
                }
            }

            if (msg.startsWith('bestmove')) {
                const parts = msg.split(' ');
                const move = parts[1];
                setBestMove(move);
            }
        };
    }, [worker.current]); // Re-attach listener if worker changes (rare) or just define inside loadEngine? 
    // Actually, defining onmessage inside useEffect is better to avoid stale closures if we used state, 
    // but here we use setters. Ideally, we should keep the onmessage logic inside the initial loadEngine 
    // or use a ref for the listener. 
    // Let's stick to modifying the loadEngine part in the previous block to avoid complexity.

    return { engineStatus, bestMove, evaluation, evaluate };
};
