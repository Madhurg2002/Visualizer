// Sieve of Eratosthenes to generate primes up to n
export const generatePrimes = (limit) => {
    const isPrime = new Uint8Array(limit + 1).fill(1);
    isPrime[0] = 0;
    isPrime[1] = 0;
    
    for (let i = 2; i * i <= limit; i++) {
        if (isPrime[i]) {
            for (let j = i * i; j <= limit; j += i) {
                isPrime[j] = 0;
            }
        }
    }
    return isPrime;
};

// Map integer n to (x, y) for Ulam Spiral
// Standard Ulam spiral starts at center 1 and spirals out
export const getUlamCoords = (n) => {
    if (n === 1) return { x: 0, y: 0 };
    
    // k = layer number (0 = center)
    // Find k such that (2k-1)^2 < n <= (2k+1)^2
    // Approximate k ~ sqrt(n)/2
    
    /* 
       Optimized approach:
       Root of nearest odd square:
       s = ceil(sqrt(n))
       if s is even, s++
    */
    let s = Math.ceil(Math.sqrt(n));
    if (s % 2 === 0) s++;
    
    const k = (s - 1) / 2; // layer
    const s2 = s * s;      // max visible number in this square layer (bottom right corner)
    
    // Offsets from center
    let x = k;
    let y = k;
    
    // We are at bottom right corner (s^2). Walk back.
    const side = s - 1; // Side length of the ring
    
    const diff = s2 - n;
    
    if (diff < side) {
        // Bottom side: move left
        x -= diff;
    } else if (diff < 2 * side) {
        // Left side: move left then up
        x -= side;
        y -= (diff - side);
    } else if (diff < 3 * side) {
        // Top side: move left, up, then right
        x = x - side + (diff - 2 * side);
        y -= side;
    } else {
        // Right side: move left, up, right, then down
        x = k; // rightmost
        y = y - side + (diff - 3 * side);
    }
    
    return { x, y };
};

// Map integer n to (x, y) for Sacks Spiral
// r = sqrt(n), theta = sqrt(n) * 2pi
export const getSacksCoords = (n) => {
    const root = Math.sqrt(n);
    const r = root;
    const theta = root * 2 * Math.PI;
    
    // Convert polar to cartesian
    // Rotate slightly to align better? Standard Sacks usually aligns squares on western ray
    const x = -r * Math.cos(theta); // Negate to align easier visually
    const y = -r * Math.sin(theta);
    
    return { x, y };
};
