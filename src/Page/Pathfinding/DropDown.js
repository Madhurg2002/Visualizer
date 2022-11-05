import React, { useRef } from "react";
export default function DropdownComponent() {
    return (
        <div className="relative w-full lg:max-w-sm">
            <select className="w-full p-2.5 text-gray-500 bg-white border rounded-md shadow-sm outline-none appearance-none focus:border-indigo-600">
                <option name="algo1">Single Source Shortest Path</option>
                <option name="algo2">algo1</option>
                <option name="algo3">algo2</option>
                <option name="algo4">algo3</option>
            </select>
        </div>
    );
}