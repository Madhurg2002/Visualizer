import { useEffect, useRef } from 'react';

/**
 * setInterval with a stable callback reference; pass `delay = null` to pause.
 * Mirrors the pattern used by FallingBlocks (src/Page/Games/FallingBlocks/hooks/useInterval.js).
 */
export default function useInterval(callback, delay) {
    const savedCallback = useRef();

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (delay !== null && delay !== undefined) {
            const id = setInterval(() => savedCallback.current(), delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}
