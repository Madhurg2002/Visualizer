export class PendulumState {
    constructor(n, masses, lengths, angles) {
        this.n = n;
        this.masses = masses || Array(n).fill(1);
        this.lengths = lengths || Array(n).fill(100);
        this.angles = angles || Array(n).fill(Math.PI / 2);
        this.velocities = Array(n).fill(0);
        this.g = 1; // Default gravity, can be scaled
        this.damping = 0.005; // Air resistance
    }

    // Solve for angular accelerations using Lagrangian Mechanics
    // This is an O(N^3) operation roughly, but for small N (< 10) it's fine.
    // Equation form: A * alpha = B
    solve(dt) {
        const { n, masses, lengths, angles, velocities, g, damping } = this;

        // A matrix (LHS) and B vector (RHS)
        const A = Array(n).fill(0).map(() => Array(n).fill(0));
        const B = Array(n).fill(0);

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // Determine coeff for alpha_j
                // mass term: sum(m_k) for k = max(i, j) to n-1
                let m_term = 0;
                for (let k = Math.max(i, j); k < n; k++) {
                    m_term += masses[k];
                }

                const theta_diff = angles[i] - angles[j];
                const cos_diff = Math.cos(theta_diff);

                A[i][j] = m_term * lengths[j] * cos_diff;
            }
            A[i][i] *= lengths[i]; // Correct scaling for A[i][j] where one L is already included? 
            // wait, the lagrangian derivation usually gives:
            // (M_jk * L_j * L_k * cos(th_j - th_k)) * alpha_k
            // Let's re-verify the standard form for N-pendulum.
        }

        // Correct approach for A[i][j]:
        // A[i][j] = (Sum_{k=max(i,j)}^{N-1} m_k) * L_i * L_j * cos(theta_i - theta_j)
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                let mass_sum = 0;
                for (let k = Math.max(i, j); k < n; k++) {
                    mass_sum += masses[k];
                }
                A[i][j] = mass_sum * lengths[i] * lengths[j] * Math.cos(angles[i] - angles[j]);
            }
        }

        // Fill B vector (Coriolis, Centrifugal, Gravity forces)
        // B[i] = - (Sum_{k=max(i,j)}^{N-1} m_k) * g * L_i * sin(theta_i) 
        //        - Sum_{j=0}^{N-1} (Sum_{k=max(i,j)}^{N-1} m_k) * L_i * L_j * sin(theta_i - theta_j) * omega_j^2
        for (let i = 0; i < n; i++) {
            let gravity_term = 0;
            let mass_sum_i = 0;
            for (let k = i; k < n; k++) mass_sum_i += masses[k];

            gravity_term = -mass_sum_i * g * lengths[i] * Math.sin(angles[i]);

            let centrifugal_term = 0;
            for (let j = 0; j < n; j++) {
                let mass_sum_ij = 0;
                for (let k = Math.max(i, j); k < n; k++) {
                    mass_sum_ij += masses[k];
                }
                centrifugal_term -= mass_sum_ij * lengths[i] * lengths[j] * Math.sin(angles[i] - angles[j]) * (velocities[j] * velocities[j]);
            }

            // Damping (simple approximations)
            const damping_term = -damping * velocities[i] * lengths[i]; // simplistic

            B[i] = gravity_term + centrifugal_term + damping_term;
        }

        // Gaussian elimination to solve A * x = B for x (accelerations)
        const alpha = this.gaussianElimination(A, B);

        // Euler Integration (or RK4 if we want to be fancy, but simple Euler-Cromer is often stable enough for visuals)
        // Semi-implicit Euler
        // Euler Integration
        for (let i = 0; i < n; i++) {
            if (!isFinite(alpha[i])) {
                // Instability detected - dampen completely or stop
                this.velocities[i] = 0;
                continue;
            }
            this.velocities[i] += alpha[i] * dt;

            // Artificial velocity clamping to prevent explosion
            if (this.velocities[i] > 50) this.velocities[i] = 50;
            if (this.velocities[i] < -50) this.velocities[i] = -50;

            this.angles[i] += this.velocities[i] * dt;
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
            x += this.lengths[i] * Math.sin(this.angles[i]);
            y += this.lengths[i] * Math.cos(this.angles[i]);
            coords.push({ x, y });
        }
        return coords;
    }
}
