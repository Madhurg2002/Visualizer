import React, { useEffect, useState } from "react";
import "./Index.css"
// import Select from "react-select";
// import DropdownComponent from "./DropDown";
// import axios from "axios";
// import Token from "../../Actions/Token";
// import { useCookies } from "react-cookie";
let arr = [];
export default function PathFinding() {
    const [Grid, setGrid] = useState();
    const [size, setSize] = useState(20);
    var md = false;
    function lcp() { md = false; }
    function lco() { md = true; }
    var SleepTime = 2;
    async function algo() {
        console.log("?");
        const arr1 = Array.from({ length: size }, () => Array.from({ length: 2 * size }, () => 0));
        function check(j, i, arr) {
            var cell = arr[j][i];
            var count = -cell;
            for (let k = j - 1; k <= j + 1; k++)
                for (let l = i - 1; l <= i + 1; l++)
                    count += arr[(size * 1 + k) % size][((2 * size) + l) % (2 * size)];
            if (count < 2) {
                return 0;
            }
            if ((cell === 1 && count === 2) || count === 3) return 1;
            return 0;
        } for (let j = 0; j < size; j++)
            for (let i = 0; i < 2 * size; i++)
                arr1[j][i] = check(j, i, arr);
        arr = arr1
        setGridtoArr(arr);
    }
    function handleChangeSpeed(a) {
        SleepTime = a.target.value
    }
    function resetGrid() {
        for (let j = 0; j < size; j++)
            for (let i = 0; i < 2 * size; i++)
                arr[j][i] = 0;
        Array.from(document.getElementsByClassName("blocks")).forEach(e => { e.className = "blocks"; })
    }
    function change(e) {
        if (md) {
            const j = parseInt((e.target.parentElement.id).replace("j-", "")), i = parseInt((e.target.id).replace("i-", ""))
            arr[j][i] = 1;
            setGridtoArr(arr)
        }
    }
    function setGridtoArr(arr) {
        var t5 = [], t6 = [];
        for (let j = 0; j < size; j++) {
            t5 = [];
            for (let i = 0; i < 2 * size; i++) {
                if (arr[j][i] === 1)
                    t5[i] = <button id={`i-${i}`} className="blocks path" value={0} onMouseEnter={change} onMouseUp={lcp} onMouseDown={e => { lco(); change(e) }} />;
                else
                    t5[i] = <button id={`i-${i}`} className="blocks" value={0} onMouseEnter={change} onMouseUp={lcp} onMouseDown={e => { lco(); change(e) }} />;
            }
            t6[j] = <div id={`j-${j}`} className="block-rows flex h-full w-screen" >{t5}</div>;
        }
        console.log("setarr")
        setGrid(t6);
    }
    const [isRunning, setIsRunning] = useState(false);
    function randomize(rows, cols) {
        console.log(arr);
        arr = new Array(rows);
        for (let i = 0; i < rows; i++) {
            arr[i] = new Array(cols);
            for (let j = 0; j < cols; j++)
                arr[i][j] = Math.round(Math.random()); // Generate either 0 or 1
        }
        console.log(arr);
        setGridtoArr(arr);
        return arr;
    }
    useEffect(() => {
        // t1 = create2DArray(2 * size, size);
        var temp = [], temp1 = [];
        arr = Array.from({ length: size }, () => Array.from({ length: 2 * size }, () => 0));
        for (let i = 0; i < 2 * size; i++)
            temp[i] = <button id={`i-${i}`} className="blocks" value={0} onMouseEnter={change} onMouseUp={lcp} onMouseDown={e => { lco(); change(e) }} />;
        for (let j = 0; j < size; j++)
            temp1[j] = <div id={`j-${j}`} className="block-rows flex h-full w-screen" >{temp}</div>;
        console.log(arr)
        setGridtoArr(arr)
        resetGrid();
        // console.log(arr)
        setIsRunning(false);
        setGrid(<>{temp1}</>);
    }, [size])
    useEffect(() => {
        let intervalId;
        if (isRunning) {
            intervalId = setInterval(() => {
                algo()
            }, 100);
        }
        return () => {
            clearInterval(intervalId);
        };
    }, [isRunning]);
    return (
        < div className="flex flex-col h-screen w-screen" >
            <div id="nav" className="flex justify-around  w-full h-100 ">
                <input type="range" min={5} max={100} onChange={
                    e => setTimeout(() => {
                        setSize(e.target.value);
                        resetGrid();
                    }, 1000)} step={1} />
                <button onClick={() => { setTimeout(() => { resetGrid(); }, 1000) }}>reset</button>
                <button onClick={() => { setTimeout(() => { randomize(size, 2 * size); }) }}>randomize</button>
                <button onClick={() => { setTimeout(() => { setIsRunning(prevIsRunning => !prevIsRunning); }, 1000) }}>{isRunning ? 'Stop' : 'Start'}</button>
                <input type="number" onChange={handleChangeSpeed} />
            </div >
            {Grid}
        </div >
    );
}