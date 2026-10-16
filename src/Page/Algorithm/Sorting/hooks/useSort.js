
import { useState, useEffect, useRef, useCallback } from 'react';
import { ALGORITHMS, sortStats, resetSortStats } from '../utils/sortingAlgorithms';

const generateRandomArray = (size) => Array.from({ length: size }, () => Math.random());

const zeroStats = () => ({ comparisons: 0, swaps: 0, writes: 0 });

export const useSort = (initialSize = 50) => {
    const [size, setSize] = useState(initialSize);
    const [array, setArray] = useState(generateRandomArray(initialSize));
    const [sorting, setSorting] = useState(false);
    const [paused, setPaused] = useState(false);
    const [activeIndices, setActiveIndices] = useState([]);
    const [algorithm, setAlgorithm] = useState("Bubble Sort");
    const [speed, setSpeed] = useState(20);
    const [isSorted, setIsSorted] = useState(false);
    const [stats, setStats] = useState(zeroStats);

    // Mirror the mutable counters in sortingAlgorithms into state so the
    // sidebar re-renders after every step.
    const syncStats = () => setStats({ ...sortStats });
    const clearStats = () => {
        resetSortStats();
        setStats(zeroStats());
    };

    // New algorithm = new baseline for the counters (select is disabled mid-run).
    useEffect(() => {
        resetSortStats();
        setStats(zeroStats());
    }, [algorithm]);

    const genRef = useRef(null);
    const initialArrayRef = useRef(array);
    const timeoutRef = useRef(null);
    const skipRegenRef = useRef(false);

    // Reset when size changes (skipped right after a custom array set that size)
    useEffect(() => {
        if (skipRegenRef.current) {
            skipRegenRef.current = false;
            return;
        }
        const newArr = generateRandomArray(size);
        setArray(newArr);
        initialArrayRef.current = newArr;
        setActiveIndices([]);
        genRef.current = null;
        setPaused(false);
        setSorting(false);
        setIsSorted(false);
        clearStats();
    }, [size]);

    const startSort = () => {
        if (!genRef.current) {
            clearStats(); // fresh run: counters start from zero
            genRef.current = ALGORITHMS[algorithm](array);
        }
        setSorting(true);
        setPaused(false);
        setIsSorted(false);
    };

    const pauseSort = () => setPaused(true);

    // Load a user-supplied array without the size effect wiping it.
    const applyCustomArray = useCallback((nums) => {
        skipRegenRef.current = true;
        setArray(nums);
        setSize(nums.length);
        setActiveIndices([]);
        genRef.current = null;
        setSorting(false);
        setPaused(false);
        setIsSorted(false);
        clearStats();
    }, []);

    const reset = () => {
        setSorting(false);
        setPaused(false);
        setActiveIndices([]);
        setArray(generateRandomArray(size));
        genRef.current = null;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsSorted(false);
        clearStats();
    };

    const stepSort = useCallback(() => {
        if (!genRef.current) return;
        const { value, done } = genRef.current.next();
        if (!done) {
            setArray(value.arr);
            setActiveIndices(value.active);
            syncStats();
        } else {
            syncStats();
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
                syncStats();
                timeoutRef.current = setTimeout(runStep, Math.max(1, 100 - speed));
            } else {
                syncStats();
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
        isSorted,
        stats,
        applyCustomArray
    };
};
