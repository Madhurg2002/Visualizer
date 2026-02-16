import React from "react";

export default function Cell({ data, onClick, onContextMenu }) {
  const { isMine, isOpen, isFlagged, neighborCount } = data;

  const getColor = () => {
    if (isMine && isOpen) return "bg-red-500/80 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]";
    if (isMine && !isOpen) return "bg-white/5 hover:bg-white/10"; // Should not happen usually unless lost
    if (isOpen) return "bg-black/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]";
    return "bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-[inset_1px_1px_0_rgba(255,255,255,0.2)]"; 
  };

  const getTextColor = (count) => {
    switch (count) {
      case 1: return "text-blue-400 drop-shadow-md";
      case 2: return "text-green-400 drop-shadow-md";
      case 3: return "text-red-400 drop-shadow-md";
      case 4: return "text-purple-400 drop-shadow-md";
      case 5: return "text-orange-400 drop-shadow-md";
      case 6: return "text-teal-400 drop-shadow-md";
      case 7: return "text-white drop-shadow-md";
      case 8: return "text-gray-400 drop-shadow-md";
      default: return "";
    }
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`
        w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center font-bold select-none cursor-pointer 
        border-[0.5px] border-black/20
        transition-all duration-150
        text-lg
        ${getColor()}
        ${isOpen ? "" : "active:scale-95"}
      `}
    >
      {isOpen && !isMine && neighborCount > 0 && (
        <span className={getTextColor(neighborCount)}>{neighborCount}</span>
      )}
      {isOpen && isMine && <span className="animate-pulse">💣</span>}
      {!isOpen && isFlagged && <span className="drop-shadow-lg filter brightness-110">🚩</span>}
    </div>
  );
}
