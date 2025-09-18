import React, { useState, useEffect, useRef } from "react";

function* bubbleSort(array) {
  let arr = array.slice();
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { arr: arr.slice(), active: [j, j + 1] };
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { arr: arr.slice(), active: [j, j + 1] };
      }
    }
  }
  yield { arr: arr.slice(), active: [] };
}

function* selectionSort(array) {
  let arr = array.slice();
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { arr: arr.slice(), active: [j, minIdx] };
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      yield { arr: arr.slice(), active: [i, minIdx] };
    }
  }
  yield { arr: arr.slice(), active: [] };
}

function* insertionSort(array) {
  let arr = array.slice();
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      yield { arr: arr.slice(), active: [j, j + 1] };
      arr[j + 1] = arr[j];
      j--;
      yield { arr: arr.slice(), active: [j + 1] };
    }
    arr[j + 1] = key;
    yield { arr: arr.slice(), active: [j + 1] };
  }
  yield { arr: arr.slice(), active: [] };
}

function* quickSort(array) {
  let arr = array.slice();

  function* partition(low, high) {
    let pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      yield { arr: arr.slice(), active: [j, high] };
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        yield { arr: arr.slice(), active: [i, j] };
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    yield { arr: arr.slice(), active: [i + 1, high] };
    return i + 1;
  }

  function* qs(low, high) {
    if (low < high) {
      const partGen = partition(low, high);
      let pi;
      let result = partGen.next();
      while (!result.done) {
        yield result.value;
        result = partGen.next();
      }
      pi = result.value;
      yield* qs(low, pi - 1);
      yield* qs(pi + 1, high);
    }
  }

  yield* qs(0, arr.length - 1);
  yield { arr: arr.slice(), active: [] };
}

function* mergeSort(array) {
  let arr = array.slice();

  function* merge(low, mid, high) {
    let left = arr.slice(low, mid + 1);
    let right = arr.slice(mid + 1, high + 1);
    let i = 0,
      j = 0,
      k = low;
    while (i < left.length && j < right.length) {
      yield { arr: arr.slice(), active: [k] };
      if (left[i] <= right[j]) {
        arr[k++] = left[i++];
      } else {
        arr[k++] = right[j++];
      }
    }
    while (i < left.length) arr[k++] = left[i++];
    while (j < right.length) arr[k++] = right[j++];
    yield { arr: arr.slice(), active: [] };
  }

  function* ms(low, high) {
    if (low < high) {
      let mid = Math.floor((low + high) / 2);
      yield* ms(low, mid);
      yield* ms(mid + 1, high);
      yield* merge(low, mid, high);
    }
  }

  yield* ms(0, arr.length - 1);
  yield { arr: arr.slice(), active: [] };
}

const ALGORITHMS = {
  "Bubble Sort": bubbleSort,
  "Selection Sort": selectionSort,
  "Insertion Sort": insertionSort,
  "Quick Sort": quickSort,
  "Merge Sort": mergeSort,
};

function generateRandomArray(size) {
  return Array.from({ length: size }, () => Math.random());
}

export default function Sort() {
  const [size, setSize] = React.useState(30);
  const [array, setArray] = React.useState(generateRandomArray(30));
  const [sorting, setSorting] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [activeIndices, setActiveIndices] = React.useState([]);
  const [algorithm, setAlgorithm] = React.useState("Bubble Sort");
  const genRef = React.useRef(null);
  const initialArrayRef = React.useRef(array);

  React.useEffect(() => {
    if(!sorting){
      const newArr = generateRandomArray(size);
      setArray(newArr);
      initialArrayRef.current = newArr;
      setActiveIndices([]);
      genRef.current = null;
      setPaused(false);
    }
  }, [size, algorithm, sorting]);

  const startSort = () => {
    if(!genRef.current){
      genRef.current = ALGORITHMS[algorithm](array);
    }
    setSorting(true);
    setPaused(false);
  };

  const pauseSort = () => setPaused(true);

  const stepSort = () => {
    if(!genRef.current) return;
    const {value, done} = genRef.current.next();
    if(!done){
      setArray(value.arr);
      setActiveIndices(value.active);
    } else{
      setSorting(false);
      setPaused(false);
      setActiveIndices([]);
      genRef.current = null;
    }
  };

  // Reset allowed if not actively sorting (i.e. disabled during sorting && !paused)
  const reset = () => {
    setSorting(false);
    setPaused(false);
    setActiveIndices([]);
    setArray(initialArrayRef.current);
    genRef.current = null;
  };

  React.useEffect(() => {
    if(!sorting || paused){
      return;
    }
    let timeoutId;

    const runStep = () => {
      if(!genRef.current) return;
      const {value, done} = genRef.current.next();
      if(!done){
        setArray(value.arr);
        setActiveIndices(value.active);
        timeoutId = setTimeout(runStep, 20);
      } else {
        setActiveIndices([]);
        setSorting(false);
        setPaused(false);
        genRef.current = null;
      }
    };

    timeoutId = setTimeout(runStep, 20);
    return () => clearTimeout(timeoutId);
  }, [sorting, paused]);



  const barStyle = (val, idx) => ({
    height: `${val * 100}%`,
    width: `${100 / size}%`,
    background: activeIndices.includes(idx)
      ? "linear-gradient(180deg,#fbbc04,#8f5cf8)"
      : "linear-gradient(180deg, #2563eb 60%, #1e293b)",
    marginRight: "2px",
    borderRadius: "2px",
    display: "inline-block",
    boxShadow: activeIndices.includes(idx) ? "0 0 8px #8f5cf8" : "none",
    transition: "height 0.14s cubic-bezier(.42,0,.58,1)",
  });

  return (
    <div
      style={{
        background: "#f9fafb",
        height: "100vh",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <label>
          Size: {size}
          <input
            type="range"
            min={10}
            max={100}
            disabled={sorting}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            style={{ marginLeft: 8 }}
          />
        </label>

        <select
          disabled={sorting}
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
        >
          {Object.keys(ALGORITHMS).map((algo) => (
            <option key={algo} value={algo}>
              {algo}
            </option>
          ))}
        </select>

        {!sorting && (
          <button
            onClick={startSort}
            style={{ cursor: "pointer", padding: "8px 18px" }}
          >
            Start
          </button>
        )}
        {sorting && !paused && (
          <button
            onClick={pauseSort}
            style={{ cursor: "pointer", padding: "8px 18px" }}
          >
            Pause
          </button>
        )}
        {sorting && paused && (
          <>
            <button
              onClick={startSort}
              style={{ cursor: "pointer", padding: "8px 18px" }}
            >
              Resume
            </button>
            <button
              onClick={stepSort}
              style={{ cursor: "pointer", marginLeft: 10, padding: "8px 18px" }}
            >
              Step
            </button>
          </>
        )}

        <button
          onClick={reset}
          style={{
            cursor: sorting ? "default" : "pointer",
            padding: "8px 18px",
            marginLeft: 16,
          }}
        >
          Reset
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          height: "70vh",
          width: "90vw",
          border: "3px solid #e5e7eb",
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 12px #eee",
        }}
      >
        {array.map((val, idx) => (
          <div key={idx} style={barStyle(val, idx)}></div>
        ))}
      </div>
    </div>
  );
}
