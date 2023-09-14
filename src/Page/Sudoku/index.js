import React, { useEffect, useState } from "react";
import "../Sudoku/index.css"
export default function Sudoku() {
    const [board, SetBoard] = useState();
    const [numbers, setnumber] = useState();
    const [size, setSize] = useState(3);
    var SelectedNumberMain = null;
    function numberselected(SelectedNumber) {
        if (SelectedNumberMain === SelectedNumber) SelectedNumberMain = null;
        else SelectedNumberMain = SelectedNumber;
    }
    function valid(NumberToBePlaced) {

    }
    function changeBlock(e) {
        if (SelectedNumberMain == null) return
        else e.target.innerHTML = SelectedNumberMain
    }
    useEffect(() => {
        let temp = [], temp1 = [], temp2 = [], temp3 = [], temp4 = [];
        for (let j = 1; j <= size * size; j++)
            temp[j] = <button id={`number-${j}`} className="blocked h-5 w-5 flex items-center" onClick={() => numberselected(j)}>{j}</button>
        setnumber(<div className={`flex-row`}>
            {temp}
        </div>);
        for (let k = 1, j = 1; j <= size; j++) {
            temp1 = [];
            for (let i = 1; i <= size; i++)
                temp1[i] = <button id={`block-row-${i}`} className="blocked  h-12 w-12 border-2 border-sky-500 " onClick={(e) => changeBlock(e)} >{k++}</button>
            temp2[j] = <div id={`block-col--${j}`} className={`flex-row`}>{temp1}</div>;
        }
        for (let j = 1; j <= size; j++)
            temp3[j] = <div id={`big-block-row-block-${j}`} className={`flex-col  border-2 border-black`}>{temp2}</div>
        for (let j = 1; j <= size; j++)
            temp4[j] = <div id={`big-block-col-${j}`} className={`flex-row`}>{temp3}</div>
        SetBoard(
            <div className={`flex-col  border-2 border-black `}>{temp4}</div>);
    }, [size])
    return <div className="h-1/2 flex-col">
        {/* <div className="flex centeredGrid">
            <input type="range" min={2} max={4} defaultValue={2} onChange={e => setTimeout(() => { setSize(e.target.value); console.log(e.target.value) }, 1000)} step={1} />
        </div> */}
        <div className="h-1/2 centeredGrid">
            {board}
        </div>
    </div >;
}