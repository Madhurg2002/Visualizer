// Classic heuristic Snake AI: BFS to food through the snake's body, with a
// "follow your own tail" survival fallback when no safe path exists.
// Pure functions over the game state from game.js — easily unit-testable.

import { GRID_W, GRID_H, DIRS } from './game';

const key = (x, y) => x + ',' + y;

function neighbors(x, y) {
    return [
        { x: x + 1, y, dir: 'right' },
        { x: x - 1, y, dir: 'left' },
        { x, y: y + 1, dir: 'down' },
        { x, y: y - 1, dir: 'up' },
    ];
}

function blocked(state, allowTailTip) {
    const set = new Set();
    state.snake.forEach((p, i) => {
        const isTailTip = i === state.snake.length - 1;
        if (allowTailTip && isTailTip) return; // tail tip vacates this tick
        set.add(key(p.x, p.y));
    });
    return set;
}

/** BFS shortest path from head to target avoiding the snake body. Returns first move name or null. */
function bfsTo(state, target, blockedSet) {
    const head = state.snake[0];
    const startK = key(head.x, head.y);
    const targetK = key(target.x, target.y);
    if (startK === targetK) return null;

    const visited = new Set([startK]);
    const queue = [{ x: head.x, y: head.y, first: null }];
    while (queue.length) {
        const cur = queue.shift();
        for (const n of neighbors(cur.x, cur.y)) {
            if (n.x < 0 || n.y < 0 || n.x >= GRID_W || n.y >= GRID_H) continue;
            const k = key(n.x, n.y);
            if (visited.has(k)) continue;
            if (blockedSet.has(k) && k !== targetK) continue;
            const first = cur.first || n.dir;
            if (k === targetK) return first;
            visited.add(k);
            queue.push({ x: n.x, y: n.y, first });
        }
    }
    return null;
}

/** Flood-fill count of cells reachable from a hypothetical head position. */
function reachableCount(headX, headY, blockedSet) {
    const seen = new Set([key(headX, headY)]);
    const stack = [{ x: headX, y: headY }];
    while (stack.length) {
        const { x, y } = stack.pop();
        for (const n of neighbors(x, y)) {
            if (n.x < 0 || n.y < 0 || n.x >= GRID_W || n.y >= GRID_H) continue;
            const k = key(n.x, n.y);
            if (seen.has(k) || blockedSet.has(k)) continue;
            seen.add(k);
            stack.push({ x: n.x, y: n.y });
        }
    }
    return seen.size;
}

/**
 * Decide the next move for the heuristic autopilot.
 * 1. BFS to food — but only take it if, after eating, we could still reach our own tail
 *    (classic safety check that avoids self-trapping).
 * 2. Otherwise chase the tail (guaranteed-safe move keeps the game alive).
 * 3. Otherwise any legal move that maximizes reachable space.
 */
export function nextMove(state) {
    if (!state.alive || state.won) return null;
    const head = state.snake[0];

    const noTail = blocked(state, false);
    const withTail = blocked(state, true);

    // 1) Greedy BFS toward food, with a lookahead safety check.
    const toFood = bfsTo(state, state.food, withTail);
    if (toFood && state.food) {
        const v = DIRS[toFood];
        const nx = head.x + v.x, ny = head.y + v.y;
        // Simulated post-eat body: head + full current body (tail stays because we grow).
        const simBody = [{ x: nx, y: ny }, ...state.snake];
        const simBlocked = new Set();
        simBody.slice(0, -1).forEach((p) => simBlocked.add(key(p.x, p.y)));
        const tail = simBody[simBody.length - 1];
        if (reachableCount(tail.x, tail.y, simBlocked) > 1) {
            return toFood;
        }
    }

    // 2) Chase the tail tip (it always vacates, so this is the safest stall).
    const tail = state.snake[state.snake.length - 1];
    const toTail = bfsTo(state, tail, withTail);
    if (toTail) return toTail;

    // 3) Survival: pick the legal move with the most reachable free space.
    let best = null, bestCount = -1;
    for (const [name, v] of Object.entries(DIRS)) {
        const nx = head.x + v.x, ny = head.y + v.y;
        if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
        if (noTail.has(key(nx, ny))) continue;
        const c = reachableCount(nx, ny, noTail);
        if (c > bestCount) { bestCount = c; best = name; }
    }
    return best;
}
