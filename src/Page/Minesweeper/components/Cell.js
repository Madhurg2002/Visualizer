import React from "react";

export default function Cell({ data, onClick, onContextMenu }) {
  const { isMine, isOpen, isFlagged, neighborCount } = data;

  const getColor = () => {
    if (isOpen) {
      if (isMine) return "bg-red-500";
      return "bg-slate-200";
    }
    return "bg-slate-400 hover:bg-slate-300";
  };

  const getTextColor = (count) => {
    switch (count) {
      case 1: return "text-blue-600";
      case 2: return "text-green-600";
      case 3: return "text-red-600";
      case 4: return "text-purple-800";
      case 5: return "text-orange-800";
      case 6: return "text-teal-600";
      case 7: return "text-black";
      case 8: return "text-gray-600";
      default: return "";
    }
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`
        aspect-square w-full flex items-center justify-center font-bold text-sm select-none cursor-pointer border border-slate-500
        ${getColor()}
        ${isOpen ? "" : "shadow-inner"}
      `}
    >
      {isOpen && !isMine && neighborCount > 0 && (
        <span className={getTextColor(neighborCount)}>{neighborCount}</span>
      )}
      {isOpen && isMine && <span>💣</span>}
      {!isOpen && isFlagged && <span>🚩</span>}
    </div>
  );
}
