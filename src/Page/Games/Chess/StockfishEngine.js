import { boardToFen } from './logic';

class Stockfish {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.onMessage = (msg) => { }; // Callback
        this.onBestMove = null;
        this.onEvaluation = null;
    }

    init() {
        const loadWorker = async (url) => {
            try {
                const response = await fetch(url);
                const contentType = response.headers.get('content-type');
                if (!response.ok || (contentType && contentType.includes('text/html'))) {
                    throw new Error('File not found or is HTML');
                }
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                this.worker = new Worker(blobUrl);
                this._setupWorker();
            } catch (e) {
                // If local failed, try CDN
                if (url.startsWith('/')) {
                    console.warn("Local stockfish failed, trying CDN...");
                    loadWorker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js');
                } else {
                    console.error("Stockfish failed to load:", e);
                }
            }
        };

        loadWorker('/stockfish.js');
    }

    _setupWorker() {
        if (!this.worker) return;
        this.worker.onmessage = (e) => {
            const msg = e.data;
            if (msg === 'readyok') {
                this.isReady = true;
                console.log("Stockfish Ready");
            }

            // Parse Best Move
            if (msg.startsWith('bestmove')) {
                const parts = msg.split(' ');
                const moveStr = parts[1];
                if (this.onBestMove && moveStr) this.onBestMove(moveStr);
            }

            // Parse Eval: "info depth 10 ... score cp 50 ..."
            if (msg.startsWith('info') && msg.includes('score')) {
                // regex to extract cp or mate
                const cpMatch = msg.match(/score cp (-?\d+)/);
                const mateMatch = msg.match(/score mate (-?\d+)/);

                if (mateMatch) {
                    const mate = parseInt(mateMatch[1]);
                    // Large score for mate (20000)
                    this.onEvaluation && this.onEvaluation(mate > 0 ? 20000 : -20000);
                } else if (cpMatch) {
                    const cp = parseInt(cpMatch[1]);
                    this.onEvaluation && this.onEvaluation(cp);
                }
            }

            this.onMessage(msg);
        };

        this.worker.postMessage('uci');
    }

    evaluate(board, turn, depth, lastMove) {
        if (!this.worker) return;
        const fen = boardToFen(board, turn);
        this.worker.postMessage(`position fen ${fen}`);
        this.worker.postMessage(`go depth ${depth}`);
    }

    quit() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

export default new Stockfish();
