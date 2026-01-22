import React, { useEffect, useRef } from 'react';

const MoveHistory = ({ moves, viewMode = 'table' }) => {
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [moves, viewMode]);

    // Group moves into pairs (White, Black)
    const movePairs = [];
    for (let i = 0; i < moves.length; i += 2) {
        movePairs.push({
            number: movePairs.length + 1,
            white: moves[i],
            black: moves[i + 1] || null
        });
    }

    const exportPGN = () => {
        let pgn = "";
        movePairs.forEach(pair => {
            pgn += `${pair.number}. ${pair.white} ${pair.black || ""} `;
        });
        navigator.clipboard.writeText(pgn.trim());
        alert("PGN copied to clipboard!");
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-800 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Move History</h3>
                <button
                    onClick={exportPGN}
                    className="text-xs text-blue-400 hover:text-white transition-colors"
                >
                    Copy PGN
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {viewMode === 'table' ? (
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead>
                            <tr className="text-xs text-slate-500 uppercase">
                                <th className="py-1 pl-2 w-10">#</th>
                                <th className="py-1">White</th>
                                <th className="py-1">Black</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movePairs.map((pair) => (
                                <tr key={pair.number} className="even:bg-white/5 hover:bg-white/10 transition-colors">
                                    <td className="py-1 pl-2 text-slate-500 font-mono">{pair.number}.</td>
                                    <td className="py-1 font-medium text-white">{pair.white}</td>
                                    <td className="py-1 font-medium text-white">{pair.black || "..."}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-wrap gap-2 content-start text-sm">
                        {movePairs.map((pair) => (
                            <div key={pair.number} className="bg-slate-800 px-2 py-1 rounded border border-white/5 hover:bg-slate-700 transition-colors">
                                <span className="text-slate-500 mr-1">{pair.number}.</span>
                                <span className="text-white font-medium">{pair.white}</span>
                                {pair.black && <span className="text-slate-300 ml-1">{pair.black}</span>}
                            </div>
                        ))}
                    </div>
                )}
                <div ref={endRef} />
            </div>
        </div>
    );
};

export default MoveHistory;
