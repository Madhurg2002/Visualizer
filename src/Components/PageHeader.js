import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Shared page header used by all game/visualizer pages for UI consistency.
 *
 * Props:
 * - title: string                 — page title (gradient text)
 * - accent?: string               — Tailwind gradient classes, default brand indigo→purple→pink
 * - subtitle?: React.ReactNode    — small badge/label shown under the title (e.g. difficulty chip)
 * - backTo?: string               — route to navigate back to (default "/")
 * - right?: React.ReactNode       — action button(s) on the right (e.g. settings)
 */
export default function PageHeader({ title, accent = 'from-blue-400 via-purple-400 to-pink-400', subtitle, backTo = '/', right }) {
    const navigate = useNavigate();

    return (
        <div className="w-full flex items-center justify-between gap-3 relative z-10">
            <button
                onClick={() => navigate(backTo)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md rounded-full border border-white/10 text-slate-300 hover:text-white transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C15]"
                title="Go back"
            >
                <ArrowLeft size={18} /> <span className="hidden md:inline">Back</span>
            </button>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <h1 className={`text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r ${accent} drop-shadow-sm`}>
                    {title}
                </h1>
                {subtitle && <div className="flex justify-center items-center gap-2 mt-1">{subtitle}</div>}
            </div>

            {right ? (
                <div className="flex items-center gap-2 shrink-0">{right}</div>
            ) : (
                // Invisible spacer keeps the centered title truly centered when there is no right action
                <div className="w-[68px] md:w-[108px]" aria-hidden="true" />
            )}
        </div>
    );
}

/** Small pill badge used in headers/controls (difficulty, mode labels). */
export const Pill = ({ children, className = '' }) => (
    <span className={`text-slate-400 font-bold uppercase tracking-wider text-xs bg-slate-900/50 px-3 py-1 rounded-full border border-white/5 ${className}`}>
        {children}
    </span>
);
