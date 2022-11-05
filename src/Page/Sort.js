import React, { useEffect, useState } from "react";
// import axios from "axios";
// import Token from "../../Actions/Token";
// import { useCookies } from "react-cookie";
export default function Sort() {
    const [table, settable] = useState()
    const [size, setSize] = useState(30)
    const [rnum, setrnum] = useState(true);
    useEffect(() => {
        async function randomizearray(temp) {
            let array = [];
            for (let i = 0; i < size; i++) {
                array[i] = i;
            }
            let i = size;
            while (i--) {
                const value = array[Math.floor(Math.random() * array.length)];
                const mstyle = { height: `${value / size * 100}%` }
                temp[i] = <div id={`${i}`} className="w-full bg-black" style={mstyle} ></div >
            }
        }
        const temp = []
        if (rnum === true)
            for (let i = 0; i < size; i++) {
                const h = (Math.random() * 100)
                const mstyle = { height: `${h}%` }
                temp[i] = <div id={`${i}`} className="w-full bg-black" style={mstyle} target={h}></div >
            }
        else {
            // for (let i = 0; i < size; i++) {
            //     const mstyle = { height: `${i / size * 100}%` }
            //     temp[i] = <div id={`${i}`} className="w-full bg-black" style={mstyle} ></div >
            // }
            console.log("ran");
            randomizearray(temp);
        }
        settable(<>
            <div id="nav" className="flex justify-around  w-full  ">
                <input type="range" min={30} max={1000} onChange={e => setTimeout(() => { setSize(e.target.value); }, 1000)} step={1} />
                <button onClick={() => setTimeout(() => {
                    setrnum(!rnum);
                    console.log(rnum);
                }, 1000)}>Randomize number</button>
            </div >
            <div className="flex-row border-r-8 border-l-8 h-screen">
                {temp}
            </div>
        </>
        )
    }, [size, rnum])
    return (
        <>{table}</>
    );
}