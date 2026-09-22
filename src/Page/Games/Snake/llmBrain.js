// OpenJev-style "typed option logits" brain for Snake.
//
// OpenJev (openjev.com) runs open models in-browser and reads calibrated scores for a
// FIXED set of options instead of free-form text. This adapter does the same for Snake:
// every decision tick we render the board as an ASCII map, ask an OpenAI-compatible
// endpoint (ollama, LM Studio, llama.cpp server, OpenJev-compatible runtimes, or a
// hosted model) to score up/down/left/right, then softmax the four logits into
// probabilities. No npm dependency — just fetch().

import { GRID_W, GRID_H } from './game';

export const MOVE_OPTIONS = ['up', 'down', 'left', 'right'];

export const DEFAULT_LLM_SETTINGS = {
    baseUrl: 'http://localhost:11434/v1', // ollama default; LM Studio: http://localhost:1234/v1
    apiKey: '',                            // local runtimes usually need none
    model: 'qwen2.5:0.5b',
    temperature: 0.2,
    timeoutMs: 4000,
};

const EMPTY = '.';
const BODY = 'o';
const HEAD = 'H';
const FOOD = 'F';

/** Render the current game state as an ASCII map + facts block for the prompt. */
export function describeGrid(state) {
    const rows = [];
    for (let y = 0; y < GRID_H; y++) {
        let row = '';
        for (let x = 0; x < GRID_W; x++) row += EMPTY;
        rows.push(row);
    }
    state.snake.forEach((p, i) => {
        rows[p.y] = rows[p.y].substring(0, p.x) + (i === 0 ? HEAD : BODY) + rows[p.y].substring(p.x + 1);
    });
    if (state.food) {
        const f = state.food;
        rows[f.y] = rows[f.y].substring(0, f.x) + FOOD + rows[f.y].substring(f.x + 1);
    }
    const head = state.snake[0];
    return [
        `${GRID_W}x${GRID_H} grid, coordinates x=column (0..${GRID_W - 1}), y=row (0..${GRID_H - 1}), y grows downward.`,
        `Legend: H=head, o=body, F=food, .=empty`,
        ...rows,
        `Head: (${head.x},${head.y}) facing ${state.dir}. Food: (${state.food.x},${state.food.y}). Length: ${state.snake.length}.`,
    ].join('\n');
}

const SYSTEM_PROMPT =
    'You are the brain of a Snake game on a grid with deadly walls. ' +
    'Pick the next move for the head: eat food while NEVER hitting a wall or your own body. ' +
    'Score every option with a confidence logit between 0 and 1. ' +
    'Respond ONLY with minified JSON, no other text: ' +
    '{"direction":"up|down|left|right","scores":{"up":0.0,"down":0.0,"left":0.0,"right":0.0}}';

function extractJson(text) {
    if (!text) return null;
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const body = fenced ? fenced[1] : text;
    const start = body.indexOf('{');
    const end = body.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
        return JSON.parse(body.slice(start, end + 1));
    } catch {
        return null;
    }
}

function softmax(scores) {
    const vals = MOVE_OPTIONS.map((d) => (Number.isFinite(scores[d]) ? scores[d] : 0));
    const max = Math.max(...vals);
    const exps = vals.map((v) => Math.exp((v - max) * 4)); // sharpen slightly
    const sum = exps.reduce((a, b) => a + b, 0) || 1;
    return exps.map((e) => e / sum);
}

/**
 * Ask the model to score the four move options for the current state.
 * Returns { options: [{ dir, score, prob }], chosen, latencyMs, raw } or throws on failure.
 */
export async function scoreOptions(state, settings, signal) {
    const user = describeGrid(state) +
        '\nWhich single move should the head make this tick? Reply with the JSON object only.';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), settings.timeoutMs || 4000);
    if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

    const started = performance.now();
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;

        const res = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers,
            signal: controller.signal,
            body: JSON.stringify({
                model: settings.model,
                temperature: settings.temperature ?? 0.2,
                max_tokens: 120,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: user },
                ],
            }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content ?? '';
        const parsed = extractJson(content);
        if (!parsed) throw new Error('Model did not return parseable JSON');

        const rawScores = parsed.scores || {};
        const scores = {};
        for (const d of MOVE_OPTIONS) {
            const v = Number(rawScores[d]);
            scores[d] = Number.isFinite(v) ? v : 0;
        }
        const probs = softmax(scores);
        const options = MOVE_OPTIONS.map((dir, i) => ({ dir, score: scores[dir], prob: probs[i] }))
            .sort((a, b) => b.prob - a.prob);

        let chosen = MOVE_OPTIONS.includes(parsed.direction) ? parsed.direction : null;
        if (!chosen) chosen = options[0].dir; // fall back to the top-logit option

        return {
            options,
            chosen,
            latencyMs: Math.round(performance.now() - started),
            raw: content,
        };
    } finally {
        clearTimeout(timeout);
    }
}
