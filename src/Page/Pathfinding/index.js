import React, { useEffect, useState } from "react";
import Select from "react-select";
// import DropdownComponent from "./DropDown";
import "./Index.css"
// import axios from "axios";
// import Token from "../../Actions/Token";
// import { useCookies } from "react-cookie";
var SetPoint = 1;
var AlgoNum = 1;
export default function PathFinding() {
    const [Grid, setGrid] = useState();
    const [size, setSize] = useState(50);
    // const [inputVal, setinputValue] = useState();
    // const [reset, setreset] = useState(true);
    // const changeVal = (e) => {
    //     setTimeout(() => {
    //         setinputValue(e.target.value);
    //         console.log(inputVal)
    //     }, 300);
    // }

    // var md = false;
    // function lcp() { md = false; }
    // function lco() { md = true; }
    // function change(e) {
    //     if (md)
    //         e.target.style.background = "red"
    // }
    var md = false;
    var SleepTime = 2;
    function lcp() { md = false; }
    function lco() { md = true; }
    function resetpath() {
        var blocks = document.getElementsByClassName("searching-path")
        Array.from(blocks).forEach(e => { e.className = "empty"; e.value = "" })
        blocks = document.getElementsByClassName("searching-path-current")
        Array.from(blocks).forEach(e => { e.className = "empty"; e.value = "" })
        blocks = document.getElementsByClassName("path")
        Array.from(blocks).forEach(e => { e.className = "empty"; e.value = "" })
    }
    function resetGrid() {
        resetpath()
        var blocks = document.getElementsByClassName("blockage")
        Array.from(blocks).forEach(e => { e.className = "empty"; e.value = 0; })
    }
    async function handleChangeSetBlock(a) {
        switch (a.Value) {
            case 2:
                SetPoint = 2;
                break;
            case 3:
                SetPoint = 3;
                break;
            default:
                SetPoint = 1;
                break;
        }
    }
    function change(e) {
        // console.log(e.target.className)
        // const cn = e.className
        // console.log(cn)
        if (e.target.className === "blockage" || e.target.className === "start" || e.target.className === "end") return
        else if (md) {
            e.target.value = ""
            if (SetPoint === 2) {
                const block = document.getElementsByClassName("start");
                Array.from(block).forEach(e => {
                    e.className = "empty"
                    // e.textContent = ""
                })
                e.target.className = "start";
                SetPoint = 1;
            }
            else if (SetPoint === 3) {
                const block = document.getElementsByClassName("end");
                Array.from(block).forEach(e => {
                    e.className = "empty"
                    // e.textContent = ""
                })
                e.target.className = "end";
                SetPoint = 1;
            }
            else
                e.target.className = "blockage";
        }
    }
    async function algoMain(AlgoNum) {
        resetpath()
        const start = document.getElementsByClassName("start")[0]
        // if(start.size===0)alert("select ")
        const end = document.getElementsByClassName("end")[0]
        var i = parseInt(start.id.replace("i-", ""))
        var j = parseInt(start.parentElement.id.replace("j-", ""))
        var ei = parseInt(end.id.replace("i-", ""))
        var ej = parseInt(end.parentElement.id.replace("j-", ""))
        var solved = false;
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        async function PathFind(i, j, val) {
            await sleep(SleepTime)
            // console.log(`${j}-${i}`)
            // console.log((document.getElementById(`j-${j}`).children)[i - 1].value)
            // console.log(val)
            if ((document.getElementById(`j-${j}`).children)[i].className === "start")
                return
            if (!((document.getElementById(`j-${j}`).children)[i].className === "end")) {
                (document.getElementById(`j-${j}`).children)[i].className = "path"
            }
            if (i > 0)
                if (parseInt((document.getElementById(`j-${j}`).children)[i - 1].value) === val) {
                    return PathFind(i - 1, j, val - 1);
                }
            if (i + 1 < 2 * size) {
                if (parseInt((document.getElementById(`j-${j}`).children)[i + 1].value) === val) {
                    return PathFind(i + 1, j, val - 1);
                }
            }
            if (j > 0) {
                if (parseInt((document.getElementById(`j-${j - 1}`).children)[i].value) === val) {
                    return PathFind(i, j - 1, val - 1);
                }
            }
            if (j + 1 < size) {
                if (parseInt((document.getElementById(`j-${j + 1}`).children)[i].value) === val) {
                    return PathFind(i, j + 1, val - 1);
                }
            } return

        }
        /* function backTrack() {
            const i = parseInt(end.id.replace("i-", ""))
            const j = parseInt(end.parentElement.id.replace("j-", ""))
            var solving = true;
            var val = end.value;
            function settopathmain(i, j, value) {
                function settopath(i, j, value) {
                    // console.log(j)
                    // console.log(document.getElementById(`j-${j}`))
                    const temp = document.getElementById(`j-${j}`).children
                    console.log(temp[i]);
                    console.log(value);
                    // solving = false

                    if (temp[i].className === "searching-path" && parseInt(temp[i].value) === value) {
                        console.log("in")
                        temp[i].className = "path";
                        // solving = false;
                    }
                    else if(temp[i].className==="start"){solving=false;}
                }
                if (j > 0 && solving)
                    settopath(i, j - 1, value)
                if (j < size - 1 && solving)
                    settopath(i, j + 1, value)
                if (i > 0 && solving)
                    settopath(i - 1, j, value)
                if (i < (size * 2) - 1 && solving)
                    settopath(i + 1, j, value)
            }
            settopathmain(i, j, val-1);
            let k=4
            while (k--) {
                const SeacrhPath = document.getElementsByClassName("searching-path")
                Array.from(SeacrhPath).forEach(e => {
                    if (parseInt(e.value) === val)
                        // settospathmain(parseInt(e.id.replace('i-', "")), parseInt(e.parentElement.id.replace('j-', "")), index);
                        settopathmain(i, j, val);
                })
                val--;
            }
        } */
        async function algo1() {
            async function settospath(i, j, value) {
                // console.log(j)
                // console.log(document.getElementById(`j-${j}`))
                const temp = document.getElementById(`j-${j}`).children
                if (temp[i].className === "searching-path" || temp[i].className === "blockage") return
                temp[i].value = value;
                if (temp[i].className === "end") {
                    solved = true;
                    return;
                }
                if (temp[i].className === "empty")
                    temp[i].className = "searching-path-current";
                return;
            }
            async function settospathmain(i, j, value) {
                const temp = document.getElementById(`j-${j}`).children;
                if (temp[i].className === "searching-path-current" && solved === false)
                    temp[i].className = "searching-path";
                // await sleep(SleepTime)
                if (j > 0 && !solved)
                    settospath(i, j - 1, value)
                if (j < size - 1 && !solved)
                    settospath(i, j + 1, value)
                if (i > 0 && !solved)
                    settospath(i - 1, j, value)
                if (i < (size * 2) - 1 && !solved)
                    settospath(i + 1, j, value)
            }
            var index = 0;
            settospathmain(i, j, index)
            // alert("No Path")
            while (solved === false) {
                await sleep(SleepTime)
                index++;
                const SeacrhPath = document.getElementsByClassName("searching-path-current");
                if (SeacrhPath.length === 0) { alert("No Path"); return; }
                Array.from(SeacrhPath).forEach(async e => {
                    if (parseInt(e.value) === index - 1) {
                        settospathmain(parseInt(e.id.replace('i-', "")),
                            parseInt(e.parentElement.id.replace('j-', "")),
                            index);
                    }
                })
            }
        }
        async function algo2() {
            async function SetToPath(i, j, value) {
                await sleep(SleepTime)
                const temp = document.getElementById(`j-${j}`).children;
                if (temp[i].className === "blockage" || solved || temp[i].className === "searching-path-current" || temp[i].className === "searching-path" || (value !== 0 && temp[i].className === "start")) return;
                if (temp[i].className === "end") { solved = true; temp[i].value = value; }
                if (!solved) {
                    if (temp[i].className === "empty") {
                        temp[i].className = "searching-path-current";
                        temp[i].value = value;
                    }
                    else if (temp[i].className === "start") {
                        temp[i].value = value;
                    }
                }
                else
                    return;
                value++;
                if (j > 0 && !solved) {
                    await SetToPath(i, j - 1, value)
                } if (i < (size * 2) - 1 && !solved) {
                    await SetToPath(i + 1, j, value)
                }
                if (j < size - 1 && !solved) {
                    await SetToPath(i, j + 1, value)
                } if (i > 0 && !solved) {
                    await SetToPath(i - 1, j, value)
                }
                if (temp[i].className === "searching-path-current" && solved === false) {
                    temp[i].className = "searching-path";
                    // temp[i].className = "searching";
                }
            }
            await SetToPath(i, j, 0);
            if (!solved) alert("no path")
        }
        async function algo3() {

        }

        switch (AlgoNum) {
            case 1:
                console.log("algo1");
                await algo1();
                break;

            case 2:
                console.log("algo2");
                await algo2();
                break;
            case 3:
                console.log("algo3");
                await algo3();
                break;

            default:
                console.log("Default");
                await algo1();
                break;
        }
        if (solved) PathFind(ei, ej, parseInt(end.value) - 1);
    }
    function handleChange(a) {
        AlgoNum = a.Value
    }
    function handleChangeSpeed(a) {
        SleepTime = a.target.value
    }
    useEffect(() => {
        var temp = [], temp1 = [], temp2 = [];
        for (let i = 0; i < size * 2; i++) {
            if (i === parseInt(size / 4))
                temp[i] = <button id={`i-${i}`} className="start" onMouseEnter={change} onMouseUp={lcp} onMouseDown={e => { lco(); change(e) }} />;
            else if (i === parseInt(7 * size / 4))
                temp[i] = <button id={`i-${i}`} className="end" onMouseEnter={change} onMouseUp={lcp} onMouseDown={e => { lco(); change(e) }} />;
            else
                temp[i] = <button id={`i-${i}`} className="empty" onMouseEnter={change} onMouseUp={lcp} onMouseDown={e => { lco(); change(e) }} />;
        }
        for (let i = 0; i < 2 * size; i++)
            temp1[i] = <button id={`i-${i}`} className="empty" onMouseEnter={change} onMouseUp={lcp} onMouseDown={e => { lco(); change(e) }} />;
        for (let j = 0; j < size; j++) {
            if (j === parseInt(size / 2))
                temp2[j] = <div id={`j-${j}`} className="board-rows flex h-full w-screen" >{temp}</div>;

            else
                temp2[j] = <div id={`j-${j}`} className="board-rows flex h-full w-screen" >{temp1}</div>;
        }
        setGrid(<>{temp2}</>);
    }, [size])
    return (<>
        < div className="flex flex-col h-screen w-screen" >
            <div id="nav" className="flex justify-around  w-full h-100 ">
                <input type="range" min={30} max={100} onChange={e => setTimeout(() => { setSize(e.target.value); resetGrid(); }, 1000)} step={1} />
                <button onClick={() => { setTimeout(() => { resetGrid(); }, 1000) }}>reset</button>
                <Select className="w-2/12" options={[
                    { Value: 1, label: 'Concurrent Dijkstra' },//Single Source Shortest Path
                    { Value: 2, label: 'DFS' },
                    { Value: 3, label: 'BFS' }
                ]} onChange={handleChange} />
                <input type="number" onChange={handleChangeSpeed} />
                <button onClick={() => algoMain(AlgoNum)}> solve</button>
                <Select options={[
                    { Value: 1, label: 'Blockage' },
                    { Value: 2, label: 'ChangeStart' },
                    { Value: 3, label: 'ChangeEnd' }
                ]} onChange={e => handleChangeSetBlock(e)} placeholder="Blockage" />
            </div >
            {Grid}
        </div>
    </>);
}