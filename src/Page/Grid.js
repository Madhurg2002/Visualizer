import { render } from "@testing-library/react";
import React, { useEffect, useState } from "react";

const [Grid, setGrid] = useState();
const [Rerender, setrerender] = useState(0);
var md = false;
class MadeGird extends React.Component {
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
    connstructor() {
        function lcp() { md = false; }
        function lco() { md = true; }
        function change(e) {
            if (md)
                e.target.style.background = "red"
        }
        function grid(){
            const temp1 = [], temp2 = [];
            for (let i = 0; i < 100; i++) {
                temp1[i] = <button id={`'i-${i}`} className="flex w-full border-2 bg-inherit" onMouseEnter={change} onMouseUp={lcp} onMouseDown={() => { lco(); change() }}  ></button >;
            }
            for (let i = 0; i < 50; i++) {
                temp2[i] = <div id={`j-${i}`} className="flex h-6 w-screen" >{temp1}</div>;
            }
            setGrid(<>
                <div id="grid" className="flex w-full ">
                    <button onClick={() => {
                        setTimeout(() => {
                            setrerender(Rerender + 1);
                            console.log(Rerender);
                        }, 1000)
                    }}>
                        reset {Rerender}</button>
                </div>
                < div className="h-screen w-screen" > {temp2}</div>
            </>)
            return grid();
            // console.log(grid.id)
            // console.log(document.getElementById("j-1").getElementById("i-1"));
            // console.log(Temp);
        }
        grid();
    }
    render() {
        return <>{Grid}</>
    }
}
export default MadeGird;