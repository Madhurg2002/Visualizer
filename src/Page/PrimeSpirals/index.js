import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generatePrimes, getUlamCoords, getSacksCoords } from './utils';

const PrimeSpirals = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    
    // State
    const [mode, setMode] = useState('ulam'); // 'ulam' | 'sacks'
    const [maxNumber, setMaxNumber] = useState(10000);
    const [zoom, setZoom] = useState(1);
    const [themeColor, setThemeColor] = useState('#06b6d4'); // Cyan-500 default
    
    // Memoize Primes to avoid re-calculating on every render if maxNumber doesn't change drastic
    // But generating up to 100k is nearly instant (ms).
    const primes = useMemo(() => generatePrimes(maxNumber), [maxNumber]);

    // Handle Zoom
    const handleZoom = (delta) => {
        setZoom(prev => Math.min(Math.max(0.1, prev + delta), 5));
    };

    // Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Clear canvas
        ctx.fillStyle = '#0B0C15';
        ctx.fillRect(0, 0, width, height);

        // Styling
        ctx.fillStyle = themeColor;
        
        // Base Unit Size (pixels per number step)
        // Adjust base scale dynamically based on max number to keep it fit?
        // Or fixed scale and let user zoom.
        // For Ulam, n=10000 -> 100x100 grid. Fit to screen? 
        // 100x100 grid on 800px screen -> 8px per unit.
        // n=40000 -> 200x200 grid -> 4px unit.
        const baseScale = mode === 'ulam' 
            ? Math.min(width, height) / Math.sqrt(maxNumber) * 0.8 
            : Math.min(width, height) / (Math.sqrt(maxNumber) * 2) * 0.8;
            
        const scale = baseScale * zoom;
        
        // Optimize drawing: only draw points? Or squares?
        // Circles are nicer but slower. Rects are fast.
        // For distinct points:
        const pointSize = Math.max(1.5, scale * 0.6);

        // Draw Spiral
        // Batch drawing? 
        // Iterate only Primes to save performance
        for (let n = 1; n <= maxNumber; n++) {
            if (primes[n]) {
                const { x, y } = mode === 'ulam' ? getUlamCoords(n) : getSacksCoords(n);
                
                const drawX = centerX + x * scale;
                const drawY = centerY + y * scale;

                // Simple culling
                if (drawX < -10 || drawX > width + 10 || drawY < -10 || drawY > height + 10) continue;

                ctx.beginPath();
                // Rect is faster than arc
                ctx.fillRect(drawX - pointSize/2, drawY - pointSize/2, pointSize, pointSize);
                
                // Glow effect?
                // Too expensive for 10k points to do shadowBlur on each.
                // Just do plain color.
            }
        }
        
        // Add minimal center marker
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centerX - 1, centerY - 1, 2, 2);

    }, [mode, maxNumber, zoom, primes, themeColor]);


    // handle resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                canvasRef.current.width = parent.clientWidth;
                canvasRef.current.height = parent.clientHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="min-h-screen bg-[#0B0C15] text-white flex flex-col items-center relative overflow-hidden font-sans">
            
            {/* Controls Overlay */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-4 max-w-xs pointer-events-none md:pointer-events-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all font-bold w-fit pointer-events-auto"
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl pointer-events-auto">
                    <h1 className="text-2xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        Prime Spirals
                    </h1>
                    
                    {/* Mode Toggle */}
                    <div className="flex bg-slate-800/50 rounded-lg p-1 mb-6 border border-white/5">
                        <button 
                            onClick={() => setMode('ulam')}
                            className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'ulam' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Ulam
                        </button>
                        <button 
                            onClick={() => setMode('sacks')}
                            className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'sacks' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Sacks
                        </button>
                    </div>

                    {/* Max Number Slider */}
                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                             <span className="text-xs font-bold text-slate-400 uppercase">Max Number</span>
                             <span className="text-xs font-mono text-cyan-400">{maxNumber.toLocaleString()}</span>
                        </div>
                        <input 
                            type="range" min="1000" max="100000" step="1000"
                            value={maxNumber}
                            onChange={(e) => setMaxNumber(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    {/* Zoom & Color */}
                    <div className="flex gap-4 items-center justify-between">
                         <div className="flex gap-2">
                            <button onClick={() => handleZoom(-0.2)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-white/10">
                                <ZoomOut size={18} />
                            </button>
                            <button onClick={() => setZoom(1)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-white/10">
                                <Maximize size={18} />
                            </button>
                            <button onClick={() => handleZoom(0.2)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-white/10">
                                <ZoomIn size={18} />
                            </button>
                        </div>
                        
                        <input 
                            type="color" 
                            value={themeColor}
                            onChange={(e) => setThemeColor(e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                        />
                    </div>
                </div>
                
                {/* Info Card */}
               <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl pointer-events-auto">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        {mode === 'ulam' 
                            ? "The Ulam spiral reveals patterns in prime numbers when arranging positive integers in a square spiral. Notice the diagonal lines of primes."
                            : "The Sacks spiral arranges integers on an Archimedean spiral. It highlights alignment of primes along specific curves (like Euler's polynomial)."
                        }
                    </p>
               </div>
            </div>

            {/* Canvas Container */}
            <div className="absolute inset-0 z-0">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
        </div>
    );
};

export default PrimeSpirals;
