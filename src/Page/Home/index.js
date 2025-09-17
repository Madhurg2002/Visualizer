import React from "react";
import { Link } from "react-router-dom";

const backgrounds = {
  Sort: "url('/images/sort.png')",
  Sudoku: "url('/images/sudoku.png')",
  PathFinding: "url('/images/pathfinding.jpg')",
  CellularAutomata: "url('/images/cellularautomata.png')",
  GameOfLife: "url('/images/gameoflife.jpg')",
};
const OptionLink = ({ heading, color, index }) => {
  const backgroundImage = backgrounds[heading];
  return (
    <Link
      key={heading}
      to={`/${heading}`}
      aria-label={`Go to ${heading} visualizer`}
      role="link"
      tabIndex="0"
      className={`
        group flex flex-col items-center justify-center ${color} opacity-90
        hover:opacity-100 hover:scale-105 hover:text-white
        focus:outline-none focus:ring-4 focus:ring-white
        transition duration-300 transform shadow-lg hover:shadow-2xl
        animation-slide-fade rounded-lg mx-4 my-6 max-w-xs w-full h-48 bg-cover bg-center bg-no-repeat
      `}
      style={{
        animationDelay: `${index * 150}ms`,
        animationFillMode: "forwards",
        backgroundImage,
        backgroundBlendMode: "overlay",
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
    >
      {/* Text hidden by default, shown on hover */}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-2xl font-semibold mt-3 text-white">
        {heading}
      </span>
    </Link>
  );
};

export default function Home() {
  const options = [
    { heading: "Sort", color: "bg-violet-900" },
    { heading: "Sudoku", color: "bg-blue-900" },
    { heading: "PathFinding", color: "bg-green-900" },
    { heading: "CellularAutomata", color: "bg-yellow-900" },
    { heading: "GameOfLife", color: "bg-red-900" },
  ];

  return (
    <>
      <style>{`
        @keyframes slideFade {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animation-slide-fade {
          animation-name: slideFade;
          animation-duration: 600ms;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        body {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        }
      `}</style>
      <main className="flex flex-wrap justify-center items-center min-h-screen p-8 gap-6">
        {options.map(({ heading, color }, index) => (
          <OptionLink
            heading={heading}
            color={color}
            key={heading}
            index={index}
          />
        ))}
      </main>
    </>
  );
}
