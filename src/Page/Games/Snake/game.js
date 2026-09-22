// Pure Snake game logic — no React, no DOM. The page advances states via step().
// Grid coordinates: x = column (0..W-1), y = row (0..H-1). Head is snake[0].

export const GRID_W = 24;
export const GRID_H = 24;

export const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};

export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** Small deterministic PRNG (mulberry32) so seeds are shareable, matching Sudoku's approach. */
export function makeRng(seedStr) {
    let h = 1779033703 ^ String(seedStr).length;
    for (let i = 0; i < String(seedStr).length; i++) {
        h = Math.imul(h ^ String(seedStr).charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function randomSeed() {
    return Math.random().toString(36).slice(2, 10);
}

/** Is `dir` a legal input right now? (no instant 180° reversal) */
export function isLegalDir(currentDir, dir) {
    return DIRS[dir] && OPPOSITE[dir] !== currentDir;
}

function occupied(snake, extra = []) {
    const s = new Set();
    for (const seg of snake) s.add(seg.x + ',' + seg.y);
    for (const seg of extra) s.add(seg.x + ',' + seg.y);
    return s;
}

/** Pick a random free cell using the provided rng; null when the board is full. */
export function spawnFood(snake, rng) {
    const taken = occupied(snake);
    const free = [];
    for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
            if (!taken.has(x + ',' + y)) free.push({ x, y });
        }
    }
    if (free.length === 0) return null; // board full — the win condition
    return free[Math.floor(rng() * free.length)];
}

export function createGame(seedStr = randomSeed()) {
    const rng = makeRng(seedStr);
    const midY = Math.floor(GRID_H / 2);
    const startX = Math.floor(GRID_W / 3);
    const snake = [
        { x: startX + 2, y: midY },
        { x: startX + 1, y: midY },
        { x: startX, y: midY },
    ];
    return {
        seed: seedStr,
        snake,
        dir: 'right',
        pendingDir: null,
        food: spawnFood(snake, rng),
        score: 0,
        eaten: 0,
        alive: true,
        won: false,
        cause: null, // 'wall' | 'self' | null
        rng,
        ticks: 0,
    };
}

/**
 * Advance the game one tick with a direction name ('up'|'down'|'left'|'right').
 * Returns a NEW state (the input state is never mutated) so brains can simulate.
 */
export function step(state, dirName) {
    const s = {
        ...state,
        snake: state.snake.map((p) => ({ ...p })),
    };

    if (!s.alive || s.won) return s;

    // Accept the queued direction (set between ticks) if legal, else keep going.
    if (s.pendingDir && isLegalDir(s.dir, s.pendingDir)) s.dir = s.pendingDir;
    s.pendingDir = null;
    if (dirName && isLegalDir(s.dir, dirName)) s.dir = dirName;

    const v = DIRS[s.dir];
    const head = { x: s.snake[0].x + v.x, y: s.snake[0].y + v.y };
    s.ticks += 1;

    // Walls are deadly (classic mode); self collision ignores the tail tip since it moves away,
    // unless we're about to grow (then the tail stays).
    const hitsWall = head.x < 0 || head.y < 0 || head.x >= GRID_W || head.y >= GRID_H;
    const willGrow = s.food && head.x === s.food.x && head.y === s.food.y;
    const bodyToCheck = willGrow ? s.snake : s.snake.slice(0, -1);
    const hitsSelf = bodyToCheck.some((p) => p.x === head.x && p.y === head.y);

    if (hitsWall) {
        s.alive = false;
        s.cause = 'wall';
        return s;
    }
    if (hitsSelf) {
        s.alive = false;
        s.cause = 'self';
        return s;
    }

    s.snake.unshift(head);
    if (willGrow) {
        s.score += 10;
        s.eaten += 1;
        const nextFood = spawnFood(s.snake, s.rng);
        if (!nextFood) {
            s.won = true; // filled the whole board
            s.food = null;
        } else {
            s.food = nextFood;
        }
    } else {
        s.snake.pop();
    }
    return s;
}

/** Manually queue a direction between ticks (keyboard input). */
export function queueDir(state, dirName) {
    if (!isLegalDir(state.dir, dirName)) return state;
    return { ...state, pendingDir: dirName };
}
