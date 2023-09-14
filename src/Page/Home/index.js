import React from "react";
import './index.css'
import { Link } from 'react-router-dom';
export default function Home() {
    const options = [
        ["Sort", "bg-yellow-600"],
        ["Sudoku", "bg-orange-600"],
        ["PathFinding", "bg-blue-900"],
        ["CellularAutomata", "bg-pink-900"],
        ["GameOfLife", "bg-pink-900"]];
    return (
        // <div class></div>
        <div className="flex w-full h-screen">
            {options.map(e => {
                return <Link className={`flex-1 centered ${e[1]}`} to={`/${e[0]}`}>
                    {e[0]}
                </Link>
            })}
        </div>
    )
}