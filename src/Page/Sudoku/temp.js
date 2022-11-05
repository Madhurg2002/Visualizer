import React, { useEffect, useState } from "react";
import "../Sudoku/index.css"
export default function Sudoku() {
    const [board, SetBoard] = useState();
    const [numbers, setnumber] = useState();
    const [size, setSize] = useState(2);
    var SelectedNumberMain = null;
    function numberselected(SelectedNumber) {
        if (SelectedNumberMain === SelectedNumber) SelectedNumberMain = null;
        else SelectedNumberMain = SelectedNumber;
    }
    function changeBlock(e) {
        if (SelectedNumberMain == null) return
        else e.target.innerHTML = SelectedNumberMain
    }
    useEffect(() => {
        const temp2 = [], temp = [], temp1 = [];
        for (let j = 1; j <= size * size; j++)
            temp[j] = <button id={`number-${j}`} className="blocked h-5 w-5 flex items-center" onClick={() => numberselected(j)}>{j}</button>
        for (let j = 1; j <= size * size; j++)
            temp2[j] = <button id={j} className="blocked bg-red-600 h-12 w-12 border-2 border-sky-500 " onClick={(e) => changeBlock(e)} >{j}</button>
        for (let j = 1; j <= size * size; j++)
            temp1[j] = <div id={`block-${j}`} className={`grid grid-rows-${size} grid-cols-${size} border-4 border-sky-500`}>{temp2}</div>
        SetBoard(
            <div className={`grid grid-cols-${size} border-4 border-sky-500 `} >
                {temp1}
            </div>);
        setnumber(<div className={`flex`}>
            {temp}
        </div>);
    }, [size])
    return <div className="h-screen flex-col">
        <div className="flex centeredGrid">
            Navbar
            <input type="range" min={1} max={4} onChange={e => setTimeout(() => { setSize(e.target.value); console.log(e.target.value) }, 1000)} step={1} />
        </div>
        <div className="centeredGrid w-screen">
                {numbers}
 
        </div>
        <div className="h-full centeredGrid">
            {board}
        </div>
    </div >;
}