import React from 'react';

export default function Cell({ type }) {
  const isFilled = type && type !== 0;
  
  return (
    <div className={`
      w-6 h-6 md:w-8 md:h-8 rounded-[2px] md:rounded-[4px] transition-colors duration-200
      ${isFilled 
        ? `${type} border-t border-l border-white/40 border-b border-r border-black/20 shadow-sm` 
        : 'border border-white/5 bg-white/[0.02]'
      }
      relative
    `}>
        {/* Glossy overlay for filled cells */}
        {isFilled && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
        )}
    </div>
  );
}
