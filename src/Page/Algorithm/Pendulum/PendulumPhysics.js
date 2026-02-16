
export class PendulumSegment {
    constructor({ mass = 1, length = 100, angle = Math.PI / 2, velocity = 0, color = 'white' } = {}) {
        this.mass = mass;
        this.length = length;
        this.angle = angle;
        this.velocity = velocity; // Angular velocity (rad/s)
        this.color = color;
    }
}

export class PendulumState {
    constructor(segments) {
        // segments: Array of PendulumSegment or config objects
        this.segments = segments.map(s => {
            return s instanceof PendulumSegment ? s : new PendulumSegment(s);
        });

        this.n = this.segments.length;
        this.g = 1; // Default gravity, can be scaled
        this.damping = 0.005; // Air resistance
    }

    // Solve for angular accelerations using Lagrangian Mechanics
    // This is an O(N^3) operation roughly, but for small N (< 10) it's fine.
    // Equation form: A * alpha = B
    solve(dt) {
        const { n, segments, g, damping } = this;

        // A matrix (LHS) and B vector (RHS)
        const A = Array(n).fill(0).map(() => Array(n).fill(0));
        const B = Array(n).fill(0);

        // Pre-calculate mass sums for optimization? 
        // Or just loop. N is small.

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // Determine coeff for alpha_j
                // func: (Sum_{k=max(i,j)}^{N-1} m_k) * L_i * L_j * cos(theta_i - theta_j)

                let mass_sum = 0;
                for (let k = Math.max(i, j); k < n; k++) {
                    mass_sum += segments[k].mass;
                }

                A[i][j] = mass_sum * segments[i].length * segments[j].length * Math.cos(segments[i].angle - segments[j].angle);
            }
        }

        // Fill B vector (Coriolis, Centrifugal, Gravity forces)
        for (let i = 0; i < n; i++) {
            // Gravity Term
            // - (Sum_{k=i}^{N-1} m_k) * g * L_i * sin(theta_i) 
            let sensitivity_mass = 0;
            for (let k = i; k < n; k++) sensitivity_mass += segments[k].mass;

            const gravity_term = -sensitivity_mass * g * segments[i].length * Math.sin(segments[i].angle);

            // Centrifugal / Coriolis Terms
            // - Sum_{j=0}^{N-1} (Sum_{k=max(i,j)}^{N-1} m_k) * L_i * L_j * sin(theta_i - theta_j) * omega_j^2
            let centrifugal_term = 0;
            for (let j = 0; j < n; j++) {
                let mass_sum_ij = 0;
                for (let k = Math.max(i, j); k < n; k++) {
                    mass_sum_ij += segments[k].mass;
                }
                centrifugal_term -= mass_sum_ij * segments[i].length * segments[j].length * Math.sin(segments[i].angle - segments[j].angle) * (segments[j].velocity * segments[j].velocity);
            }

            // Damping (simple approximations)
            const damping_term = -damping * segments[i].velocity * segments[i].length;

            B[i] = gravity_term + centrifugal_term + damping_term;
        }

        // Gaussian elimination to solve A * x = B for x (accelerations)
        const alpha = this.gaussianElimination(A, B);

        // Euler Integration
        for (let i = 0; i < n; i++) {
            if (!isFinite(alpha[i])) {
                // Instability detected - reset absolute velocity to 0 to recover
                this.segments[i].velocity = 0;
                continue;
            }
            this.segments[i].velocity += alpha[i] * dt;

            // Velocity Clamping
            if (this.segments[i].velocity > 50) this.segments[i].velocity = 50;
            if (this.segments[i].velocity < -50) this.segments[i].velocity = -50;

            this.segments[i].angle += this.segments[i].velocity * dt;
        }
    }

    gaussianElimination(A, B) {
        const n = A.length;
        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxEl = Math.abs(A[i][i]);
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(A[k][i]) > maxEl) {
                    maxEl = Math.abs(A[k][i]);
                    maxRow = k;
                }
            }

            // Swap
            for (let k = i; k < n; k++) {
                const tmp = A[maxRow][k];
                A[maxRow][k] = A[i][k];
                A[i][k] = tmp;
            }
            const tmp = B[maxRow];
            B[maxRow] = B[i];
            B[i] = tmp;

            // Make all rows below this one 0 in current column
            for (let k = i + 1; k < n; k++) {
                const c = -A[k][i] / A[i][i];
                for (let j = i; j < n; j++) {
                    if (i === j) {
                        A[k][j] = 0;
                    } else {
                        A[k][j] += c * A[i][j];
                    }
                }
                B[k] += c * B[i];
            }
        }

        // Back substitution
        const x = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += A[i][j] * x[j];
            }
            x[i] = (B[i] - sum) / A[i][i];
        }
        return x;
    }

    getCoordinates() {
        let x = 0;
        let y = 0;
        const coords = [];
        for (let i = 0; i < this.n; i++) {
            x += this.segments[i].length * Math.sin(this.segments[i].angle);
            y += this.segments[i].length * Math.cos(this.segments[i].angle);
            coords.push({ x, y });
        }
        return coords;
    }

    // Helper to get raw arrays if needed by legacy viewers, or just expose segments
    get angles() { return this.segments.map(s => s.angle); }
    get Velocities() { return this.segments.map(s => s.velocity); } // getter
}
