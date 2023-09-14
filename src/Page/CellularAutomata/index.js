import React, { useEffect, useState } from "react";
import Select from "react-select";
// import DropdownComponent from "./DropDown";
import "./Index.css"
// import axios from "axios";
// import Token from "../../Actions/Token";
// import { useCookies } from "react-cookie";
var SetPoint = 1, AlgoNum = 1, WeightValue = 1;
export default function PathFinding() {
    var convolutionset = [[0.1, -0.1, 0.3], [0, 1, -0.3], [-0.5, -0.1, 0.2]];
    const [Grid, setGrid] = useState();
    const [size, setSize] = useState(4);
    var md = false;
    function lcp() { md = false; }
    function lco() { md = true; }
    var SleepTime = 2;
    function algo() {
        var blocks = document.getElementsByClassName("block-rows")
        Array.from(blocks).forEach(block => {
            var k = parseInt(block.id.replace("j-", ""));
            Array.from(block.children).forEach(e => {
                console.log(e.style)
                var l = parseInt(e.id.replace("i-", ""));
                // console.log(k, l);
                // console.log(blocks[(size + k - 1) % size].children[((2 * size) + l - 1) % (2 * size)])
                var sum = 0;
                for (let j = 0; j < 3; j++) {
                    for (let i = 0; i < 3; i++) {
                        if (blocks[(size + k + j - 1) % size].children[((2 * size) + i + l - 1) % (2 * size)].style.background === "rgb(255, 0, 0)")
                            sum = sum + convolutionset[j][i]
                    }
                }
                if (sum > 1 || sum < 0) sum = 1
                // console.log(typeof (sum))
                blocks[(size + k - 1) % size].children[((2 * size) + l - 1) % (2 * size)].value = sum;
                // e.value = sum
                // console.log(e.value, e.style.opacity);  
                // console.log(e.style.background===`rgb(255, 0, 0)`);
            })
        })
        Array.from(blocks).forEach(block => {
            Array.from(block.children).forEach(e => {
                var t = e.style.background.replace(/[^\d,]/g, '').split(',')
                e.style.background = `rgba(${t[0]}, ${t[1]}, ${t[2]}, ${e.value})`
                console.log(e.style.background)
            })
        })
    }
    function handleChangeSpeed(a) {
        SleepTime = a.target.value
    }
    function set(e, value) {
        e.value = WeightValue;
        e.target.style.background = `rgba(255, 0, 0)`
    }
    function resetGrid() {
        var blocks = document.getElementsByClassName("blocks")
        Array.from(blocks).forEach(e => { e.style = ""; e.value = 0; })
    }
    function change(e) {
        if (md) {
            e.target.style.background = `rgba(255, 0, 0, 1)`
            e.target.value = WeightValue;
        }
    }
    useEffect(() => {
        var temp = [], temp1 = [];
        var pp = {
            background: "rgba(255,255,255,1 )",
        }
        for (let i = 0; i < 2 * size; i++)
            temp[i] = <button id={`i-${i}`} className="blocks" value={0} onMouseEnter={change} style={pp} onMouseUp={lcp} onMouseDown={e => { lco(); change(e) }} />;
        for (let j = 0; j < size; j++) {
            temp1[j] = <div id={`j-${j}`} className="block-rows flex h-full w-screen" >{temp}</div>;
        }
        setGrid(<>{temp1}</>);
    }, [size])
    return (<>
        < div className="flex flex-col h-screen w-screen" >
            <div id="nav" className="flex justify-around  w-full h-100 ">
                <input type="range" min={5} max={100} onChange={
                    e => setTimeout(() => {
                        setSize(e.target.value);
                        resetGrid();
                    }, 1000)} step={1} />
                <button onClick={() => { setTimeout(() => { resetGrid(); }, 1000) }}>reset</button>
                {/* <Select options={[
                    { Value: 1, label: 'Blockage' },
                    { Value: 2, label: 'ChangeStart' },
                    { Value: 3, label: 'ChangeEnd' }
                ]} onChange={e => handleChangeSetBlock(e)} placeholder="Blockage" /> */}
                <button onClick={() => { setTimeout(() => { algo(); }, 1000) }}>Solve</button>
                <input type="number" onChange={handleChangeSpeed} />
            </div >
            {Grid}
        </div></>
    );
}