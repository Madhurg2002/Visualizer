import React from "react";
import { Link } from 'react-router-dom';
export default function Home() {
    const options = [
<<<<<<< HEAD
        { Heading: "Sort", color: "bg-violet-900" },
        { Heading: "Sudoku", color: "bg-blue-900" },
        { Heading: "PathFinding", color: "bg-green-900" },
        { Heading: "CellularAutomata", color: "bg-yellow-900" },
        { Heading: "GameOfLife", color: "bg-red-900" }];
=======
        ["Sort", "bg-yellow-600"],
        ["Sudoku", "bg-orange-600"],
        ["PathFinding", "bg-blue-900"],
        ["CellularAutomata", "bg-pink-900"],
        ["GameOfLife", "bg-pink-900"]];
>>>>>>> 4d79dda404a740062c8687ac80b4345836cd8480
    return (
        // <div class></div>
        <div className="flex w-full h-screen">
            {options.map(({ Heading, color }) => {
                return <Link className={`flex-1 flex items-center justify-center ${color} opacity-100 hover:opacity-90 hover:text-white`} to={`/${Heading}`}>
                    {Heading}
                </Link>
            })}
        </div>
    )
}