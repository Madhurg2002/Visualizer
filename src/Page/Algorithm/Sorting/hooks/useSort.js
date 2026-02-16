
import { useState, useEffect, useRef, useCallback } from 'react';
import { ALGORITHMS } from '../utils/sortingAlgorithms';

const generateRandomArray = (size) => Array.from({ length: size }, () => Math.random());

export const useSort = (initialSize = 50) => {
    const [size, setSize] = useState(initialSize);
    const [array, setArray] = useState(generateRandomArray(initialSize));
    const [sorting, setSorting] = useState(false);
    const [paused, setPaused] = useState(false);
    const [activeIndices, setActiveIndices] = useState([]);
    const [algorithm, setAlgorithm] = useState("Bubble Sort");
    const [speed, setSpeed] = useState(20);
    const [isSorted, setIsSorted] = useState(false);

    const genRef = useRef(null);
    const initialArrayRef = useRef(array);
    const timeoutRef = useRef(null);

    // Reset when size changes 
    useEffect(() => {
        const newArr = generateRandomArray(size);
        setArray(newArr);
        initialArrayRef.current = newArr;
        setActiveIndices([]);
        genRef.current = null;
        setPaused(false);
        setSorting(false);
        setIsSorted(false);
    }, [size]);

    const startSort = () => {
        if (!genRef.current) {
            genRef.current = ALGORITHMS[algorithm](array);
        }
        setSorting(true);
        setPaused(false);
        setIsSorted(false);
    };

    const pauseSort = () => setPaused(true);

    const reset = () => {
        setSorting(false);
        setPaused(false);
        setActiveIndices([]);
        setArray(generateRandomArray(size));
        genRef.current = null;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsSorted(false);
    };

    const stepSort = useCallback(() => {
        if (!genRef.current) return;
        const { value, done } = genRef.current.next();
        if (!done) {
            setArray(value.arr);
            setActiveIndices(value.active);
        } else {
            setSorting(false);
            setPaused(false);
            setActiveIndices([]);
            genRef.current = null;
            setIsSorted(true);
        }
    }, []);

    // Animation Loop
    useEffect(() => {
        if (!sorting || paused) return;

        const runStep = () => {
            if (!genRef.current) return;
            const { value, done } = genRef.current.next();

            if (!done) {
                setArray(value.arr);
                setActiveIndices(value.active);
                timeoutRef.current = setTimeout(runStep, Math.max(1, 100 - speed));
            } else {
                setSorting(false);
                setPaused(false);
                setActiveIndices([]);
                genRef.current = null;
                setIsSorted(true);
            }
        };

        timeoutRef.current = setTimeout(runStep, Math.max(1, 100 - speed));
        return () => clearTimeout(timeoutRef.current);
    }, [sorting, paused, speed]);

    return {
        size,
        setSize,
        array,
        setArray,
        sorting,
        paused,
        activeIndices,
        algorithm, setAlgorithm,
        speed, setSpeed,
        startSort,
        pauseSort,
        reset,
        stepSort,
        isSorted
    };
};
