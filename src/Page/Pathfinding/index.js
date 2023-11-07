import React, { useEffect, useState } from "react";
import Select from "react-select";
// import DropdownComponent from "./DropDown";
import "./Index.css"
import PriorityQueue from "js-priority-queue";

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
    var SleepTime = 500;
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
        async function Dijkstra() {
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
                Array.from(SeacrhPath).forEach(e => {
                    if (parseInt(e.value) === index - 1) {
                        settospathmain(parseInt(e.id.replace('i-', "")), parseInt(e.parentElement.id.replace('j-', "")), index);
                    }
                })
            }
        }
        async function DFS() {
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
        async function A_Star() {
            //drijska recursive...  get iside 1 indefinetly...  
            //make a 2d vectpr based on distance from the end  .. min distance keeps on calling
            // var mp = new Map();
            // var value = Math.abs(ei - i) + Math.abs(ej - i);
            // const dir={{-1,0},{1,0}}
            // mp.set({})
            // while (pq.length) {
            //     console.log(pq.peek()); pq.dequeue ();
            // }
<<<<<<< HEAD
            var PriorityQueue = [];
            const visited = new Array(2 * size).fill(0).map(() => new Array(size).fill(10000000));
            async function pushPQ(i, j, Gcost, value) {
                const temp = (document.getElementById(`j-${j}`).children)[i];
                if (
                    solved
                    || temp.className === "blockage"
                    || (value >= visited[i][j])
                    // || temp.className === "searching-path-current"
                    // || temp.className === "searching-path"
                    // || (value !== 0 && temp.className === "start")
                ) return;
                if (temp.className === "end") { solved = true; temp.value = value; return }
                if (!solved) {
                    if (temp.className === "empty" || temp.className === "searching-path-current") {
                        temp.className = "searching-path-current";
                        temp.value = value;
                    }
                    else if (temp.className === "start")
                        temp.value = value;
                }
                var node = {
                    Gcost: Gcost,
                    Hcost: Math.abs(ej - j) + Math.abs(ei - i),
                    Fcost: Math.abs(ei - i) + Math.abs(ej - j) + Gcost,
                    i: i,
                    j: j,
                    value: value
                };
                let l = 0;
                for (l = 0; l < PriorityQueue.length; l++)
                    if (PriorityQueue[l].Fcost > node.Fcost ||
                        (PriorityQueue[l].Fcost === node.Fcost && (
                            PriorityQueue[l].Hcost > node.Hcost || (PriorityQueue[l].value > value)
                        )))
                        break;
                PriorityQueue = [...PriorityQueue.slice(0, Math.max(l, 0)), node, ...PriorityQueue.slice(Math.max(l, 0))];
                // console.log({
                //     Gcost: node.Gcost,
                //     Hcost: node.Hcost,
                //     Fcost: node.Fcost,
                //     i: node.i,
                //     j: node.j,
                // })
                visited[i][j] = value;
            }
            pushPQ(i, j, 0, 0);
            while (solved === false) {
                await sleep(SleepTime);
                if (PriorityQueue.length === 0) { alert("No Path"); return; }
                var nGcost = PriorityQueue[0].Gcost + 1, ni = PriorityQueue[0].i, nj = PriorityQueue[0].j, value = PriorityQueue[0].value + 1;
                // console.log(ni, nj, PriorityQueue[0].Hcost, PriorityQueue[0].Fcost)
                console.log(PriorityQueue[0])
                PriorityQueue = [...PriorityQueue.slice(1)];
                if (ni > 0) await pushPQ(ni - 1, nj, nGcost, value);
                if (nj > 0) await pushPQ(ni, nj - 1, nGcost, value);
                if (ni < 2 * size - 1) await pushPQ(ni + 1, nj, nGcost, value);
                if (nj < size - 1) await pushPQ(ni, nj + 1, nGcost, value);
            }

=======
>>>>>>> 4d79dda404a740062c8687ac80b4345836cd8480

        }
        switch (AlgoNum) {
            case 1:
                console.log("Dijkstra");
                await Dijkstra();
                break;

            case 2:
                console.log("DFS");
                await DFS();
                break;
            case 3:
                console.log("A*");
                await A_Star();
                break;

            default:
                console.log("Default");
                await Dijkstra();
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
                    { Value: 3, label: 'A-Star' }
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