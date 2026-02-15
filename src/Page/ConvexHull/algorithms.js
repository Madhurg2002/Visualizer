
// Generate N random points within bounds
export const generatePoints = (n, width, height, padding = 40) => {
    const points = [];
    for (let i = 0; i < n; i++) {
        points.push({
            x: padding + Math.random() * (width - 2 * padding),
            y: padding + Math.random() * (height - 2 * padding),
            id: i
        });
    }
    return points;
};

// Cross Product (Z-component) to check orientation
// > 0 : Counter-Clockwise (Left Turn)
// < 0 : Clockwise (Right Turn)
// = 0 : Collinear
const crossProduct = (o, a, b) => {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
};

const distanceSq = (p1, p2) => {
    return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
};

// GRAHAM SCAN
export function* grahamScan(points) {
    if (points.length < 3) return;

    // 1. Find bottom-most (and left-most) point
    let startPoint = points[0];
    for (let p of points) {
        if (p.y > startPoint.y || (p.y === startPoint.y && p.x < startPoint.x)) {
            startPoint = p;
        }
    }

    yield { type: 'start', hull: [startPoint], current: startPoint, message: 'Finding bottom-most point' };

    // 2. Sort points by polar angle with startPoint
    const sortedPoints = [...points].filter(p => p !== startPoint).sort((a, b) => {
        const cp = crossProduct(startPoint, a, b);
        if (cp === 0) return distanceSq(startPoint, a) - distanceSq(startPoint, b);
        return cp > 0 ? -1 : 1; // CCW first
    });

    const hull = [startPoint];
    
    // We need to handle collinear points by removing them? 
    // Simplified Graham Scan usually keeps all if we want rigorous convex hull.

    for (let p of sortedPoints) {
        yield { type: 'check', hull: [...hull], current: p, message: `Checking point ${p.id}` };

        while (hull.length > 1 && crossProduct(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) {
             const badPoint = hull.pop();
             yield { type: 'pop', hull: [...hull], bad: badPoint, current: p, message: 'Right turn! Backtracking...' };
        }
        hull.push(p);
        yield { type: 'push', hull: [...hull], current: p, message: 'Left turn. Point added.' };
    }

    // Close ring for visual?
    yield { type: 'finished', hull: [...hull, hull[0]], message: 'Graham Scan Complete' };
}


// GIFT WRAPPING (Jarvis March)
export function* giftWrapping(points) {
    if (points.length < 3) return;

    // 1. Left-most point
    let pointOnHull = points[0];
    for (let p of points) {
        if (p.x < pointOnHull.x) pointOnHull = p;
    }

    const hull = [];
    let i = 0;
    let endpoint;

    do {
        hull.push(pointOnHull);
        yield { type: 'add', hull: [...hull], current: pointOnHull, message: `Added point to hull` };
        
        endpoint = points[0];
        
        for (let j = 1; j < points.length; j++) {
            const candidate = points[j];
            
            yield { type: 'check', hull: [...hull], current: pointOnHull, check: candidate, best: endpoint, message: 'Checking candidate...' };

            const cp = crossProduct(pointOnHull, endpoint, candidate);

            // If endpoint == pointOnHull or candidate is to the left of line (pointOnHull -> endpoint)
            if (endpoint === pointOnHull || cp > 0 || (cp === 0 && distanceSq(pointOnHull, candidate) > distanceSq(pointOnHull, endpoint))) {
                endpoint = candidate;
                yield { type: 'update', hull: [...hull], current: pointOnHull, best: endpoint, message: 'Found better candidate' };
            }
        }

        pointOnHull = endpoint;
        i++;
    } while (endpoint !== hull[0]); // Stop when we wrap around to start

    // Close visual
    yield { type: 'finished', hull: [...hull, hull[0]], message: 'Gift Wrapping Complete' };
}

// MONOTONE CHAIN
export function* monotoneChain(points) {
    if (points.length < 3) return;

    // 1. Sort by X (then Y)
    const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    yield { type: 'sort', hull: [], message: 'Sorted points by X-coordinate' };

    // 2. Build Lower Hull
    const lower = [];
    for (let p of sorted) {
        while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
             const bad = lower.pop();
             yield { type: 'pop', hull: [...lower], current: p, bad, message: 'Lower Hull: Right turn, removing...' };
        }
        lower.push(p);
        yield { type: 'push', hull: [...lower], current: p, message: 'Lower Hull: Adding point' };
    }

    // 3. Build Upper Hull
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
        const p = sorted[i];
        while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
             const bad = upper.pop();
             // Visualize combined hull
             yield { type: 'pop', hull: [...lower, ...upper], current: p, bad, message: 'Upper Hull: Right turn, removing...' };
        }
        upper.push(p);
        yield { type: 'push', hull: [...lower, ...upper], current: p, message: 'Upper Hull: Adding point' };
    }

    // Concatenate
    // Remove last point of each as it's repeated
    lower.pop();
    upper.pop();
    const hull = [...lower, ...upper, lower[0]]; // Close it

    yield { type: 'finished', hull: hull, message: 'Monotone Chain Complete' };
}
