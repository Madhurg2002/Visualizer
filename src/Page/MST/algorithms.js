
// Generate Random Graph
// nodes: array of {id, x, y}
// edges: array of {source, target, weight, id}
export const generateGraph = (nodeCount, width, height, density = 1.5) => {
    const nodes = [];
    const padding = 50;
    
    // 1. Generate Nodes
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            id: i,
            x: padding + Math.random() * (width - 2 * padding),
            y: padding + Math.random() * (height - 2 * padding),
        });
    }

    const edges = [];
    let edgeId = 0;

    // 2. Ensure Connectivity (Spanning Tree backbone)
    // Connect 0->1, 1->2 ... or random tree
    // Ideally use a simple random walk or just connect i to (0..i-1) randomly
    const connected = new Set([0]);
    const unconn = new Set(nodes.slice(1).map(n => n.id));

    while (unconn.size > 0) {
        // Pick random from connected
        const uId = [...connected][Math.floor(Math.random() * connected.size)];
        // Pick random from unconnected
        const vId = [...unconn][Math.floor(Math.random() * unconn.size)];
        
        const u = nodes[uId];
        const v = nodes[vId];
        const dist = Math.hypot(u.x - v.x, u.y - v.y);
        const weight = Math.floor(dist / 5) + 1; // Weight proportional to distance

        edges.push({ source: uId, target: vId, weight, id: edgeId++ });
        unconn.delete(vId);
        connected.add(vId);
    }

    // 3. Add random extra edges based on density
    // total edges approx nodeCount * density
    const targetEdges = nodeCount * density;
    let attempts = 0;
    while (edges.length < targetEdges && attempts < 1000) {
        attempts++;
        const uId = Math.floor(Math.random() * nodeCount);
        const vId = Math.floor(Math.random() * nodeCount);
        if (uId === vId) continue;
        
        // Check duplicate
        if (edges.some(e => (e.source === uId && e.target === vId) || (e.source === vId && e.target === uId))) continue;
        
        const u = nodes[uId];
        const v = nodes[vId];
        const dist = Math.hypot(u.x - v.x, u.y - v.y);
        // Avoid very long edges for visual clarity?
        if (dist > Math.max(width, height) * 0.4) continue;

        const weight = Math.floor(dist / 5) + 1;
        edges.push({ source: uId, target: vId, weight, id: edgeId++ });
    }

    return { nodes, edges };
};

// DSU for Kruskal's
class DSU {
    constructor(n) {
        this.parent = Array(n).fill(0).map((_, i) => i);
    }
    find(i) {
        if (this.parent[i] === i) return i;
        this.parent[i] = this.find(this.parent[i]);
        return this.parent[i];
    }
    union(i, j) {
        const rootI = this.find(i);
        const rootJ = this.find(j);
        if (rootI !== rootJ) {
            this.parent[rootI] = rootJ;
            return true;
        }
        return false;
    }
}

// KRUSKAL'S ALGORITHM
export function* kruskals(nodes, edges) {
    // 1. Sort edges
    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
    
    yield { type: 'start', mst: [], message: 'Sorted all edges by weight' };

    const dsu = new DSU(nodes.length);
    const mst = [];
    
    for (const edge of sortedEdges) {
        yield { type: 'check', mst: [...mst], current: edge, message: `Checking edge ${edge.source}-${edge.target} (w:${edge.weight})` };
        
        const rootU = dsu.find(edge.source);
        const rootV = dsu.find(edge.target);
        
        if (rootU !== rootV) {
            dsu.union(edge.source, edge.target);
            mst.push(edge);
            yield { type: 'add', mst: [...mst], current: edge, message: 'No cycle detected. Adding edge.' };
        } else {
             yield { type: 'skip', mst: [...mst], current: edge, message: 'Cycle detected! Skipping edge.' };
        }
        
        if (mst.length === nodes.length - 1) break;
    }
    
    yield { type: 'finished', mst: [...mst], message: 'MST Complete (Kruskal\'s)' };
}

// PRIM'S ALGORITHM
export function* prims(nodes, edges) {
    const adj = Array(nodes.length).fill(null).map(() => []);
    edges.forEach(e => {
        adj[e.source].push({ to: e.target, weight: e.weight, edge: e });
        adj[e.target].push({ to: e.source, weight: e.weight, edge: e });
    });

    const visited = new Set();
    const mst = [];
    
    // Start from node 0
    visited.add(0);
    yield { type: 'start', mst: [], visited: [...visited], message: 'Starting at Node 0' };
    
    // Simple edge list as priority queue (inefficient but fine for Viz < 100 nodes)
    // Edges connecting Visited to Unvisited
    
    while (visited.size < nodes.length) {
        let minEdge = null;
        let minWeight = Infinity;
        let targetNode = -1;

        // Find min edge crossing the cut
        for (const u of visited) {
            for (const neighbor of adj[u]) {
                if (!visited.has(neighbor.to)) {
                    // This edge crosses the cut
                    if (neighbor.weight < minWeight) {
                        minWeight = neighbor.weight;
                        minEdge = neighbor.edge;
                        targetNode = neighbor.to;
                    }
                    
                    // Visualize checking? Too noisy if we yield every check. 
                    // Maybe yield "Frontier update"?
                }
            }
        }

        if (minEdge) {
            yield { type: 'check', mst: [...mst], visited: [...visited], current: minEdge, message: `Found min edge to Node ${targetNode}` };
            
            visited.add(targetNode);
            mst.push(minEdge);
            
            yield { type: 'add', mst: [...mst], visited: [...visited], current: minEdge, message: `Added Node ${targetNode} to MST` };
        } else {
            // Should not happen if connected
            break;
        }
    }
    
    yield { type: 'finished', mst: [...mst], visited: [...visited], message: 'MST Complete (Prim\'s)' };
}
