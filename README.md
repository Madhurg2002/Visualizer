# Visualizer & Games Platform

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

A comprehensive interactive platform that combines educational algorithm visualizations with engaging puzzle and party games. Built with **React** for a dynamic frontend and **Node.js** for real-time multiplayer experiences.

🚀 **Live Demo:** [visualiz.vercel.app](https://visualiz.vercel.app)

---

## 🚀 Features

#### 🧠 Algorithm & Math Visualizers
Interactive visualizations to help understand complex algorithms step-by-step:
*   **Pathfinding Algorithms**:
    *   **Dijkstra's Algorithm**: Guarantees the shortest path.
    *   **A* Search**: Uses heuristics for faster pathfinding.
    *   **Breadth-First Search (BFS)**: Unweighted shortest path.
    *   **Depth-First Search (DFS)**: Explores as far as possible along each branch.
*   **Sorting Algorithms**:
    *   Visualize classic sorting methods like **Bubble Sort**, **Merge Sort**, **Quick Sort**, **Selection Sort**, and more.
    *   Adjustable speed and array size.
*   **Minimum Spanning Tree (MST)**:
    *   Visualize finding the shortest connecting network using **Prim's** and **Kruskal's** algorithms.
*   **Convex Hull**:
    *   Interactive geometric algorithm visualization.
*   **N-Queens Problem**:
    *   Watch step-by-step backtracking as the board solves the classic N non-attacking queens puzzle.
*   **Physics & Math Sandbox**:
    *   **Pendulum Simulation**: Interactive N-Pendulum physics solver with different materials (string, spring modes).
    *   **Prime Spirals**: Explore the distribution of primes in beautiful Ulam and Archimedean spirals.
    *   **Cellular Automata (Conway's Game of Life)**: A zero-player game determining the state of cells based on specific rules.

#### 🎮 Games
A collection of logic puzzles and arcade-style games:
*   **Chess**:
    *   **Modes**: Local PvP, vs Stockfish AI (adjustable depth), Online Multiplayer, and Analysis Board.
    *   **Features**:
        *   Move validation, check/checkmate detection, and legal move highlighting.
        *   **Stockfish Engine Integration**: Play against a powerful chess engine or use it to analyze positions.
        *   **Real-time Online Multiplayer**: Create rooms, set time controls, and chat with opponents using the **In-Game Chat**.
        *   **PGN Support**: Import and analyze game history.
*   **Tic-Tac-Toe**:
    *   Classic 3x3 game.
    *   **Modes**:
        *   **Solo**: Play against a Minimax AI (Unbeatable!).
        *   **Local PvP**: Two players on the same device.
        *   **Online Multiplayer**: Play with friends remotely.
*   **Forbidden Words (Taboo)**:
    *   **Online Multiplayer**: Real-time gameplay with friends using Socket.IO. Create rooms, join via ID, and compete in teams.
    *   **Local Party Mode**: Pass-and-play on a single device.
*   **Sudoku**:
    *   Classic 9x9 puzzle.
    *   **Visualization Mode**: Watch a backtracking algorithm solve the board in real-time.
    *   Seed-based generation for replayable boards.
*   **Minesweeper**:
    *   Classic strategy game with adjustable difficulty.
    *   Custom flag and reveal mechanics.
*   **Falling Blocks (Tetris Clone)**:
    *   Classic block-stacking action.
    *   Score tracking and increasing difficulty.
*   **Flappy Bird Clone**:
    *   Reflex-testing arcade game.
*   **Wordle Helper**:
    *   Interactive tool to filter possible words based on green/yellow/gray feedback and suggest optimal next guesses.
*   **Kinetic Clock**:
    *   A visually mesmerizing, highly animated clock face.

---

## 🛠️ Tech Stack

### Frontend
*   **React.js**: Component-based UI architecture.
*   **Tailwind CSS**: Utility-first styling for rapid and responsive design.
*   **Framer Motion**: Smooth animations and transitions.
*   **Lucide React**: Modern and consistent icon set.

### Backend (for Multiplayer)
*   **Node.js & Express**: robust server environment.
*   **Socket.IO**: Real-time, bidirectional communication for "Forbidden Words" online mode.

---

## 📦 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
*   **Node.js** (v14 or higher)
*   **Yarn** or **npm**

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Madhurg2002/Visualizer.git .
```

#### 2. Install Dependencies (Windows Quick Start)
If you are on Windows, you can simply run the provided batch script to install both frontend and backend dependencies automatically:
```cmd
install.bat
```

#### 3. Install Dependencies (Manual / macOS / Linux)
If you prefer manual installation or are on a Unix system:

**Frontend**:
```bash
yarn install
# or npm install
```

**Backend** (required for online multiplayer):
```bash
cd server
npm install
```

---

## 🏃 Usage

### Quick Start (Windows)
Double-click `start.bat` or run it from the command line:
```cmd
start.bat
```
This will automatically launch both the backend server and the frontend client in separate windows. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Manual Start (macOS / Linux)

**Start the Client (Frontend)**
Runs the React application in development mode.
```bash
yarn start
```

**Start the Server (Backend)**
Required for online multiplayer features. (Runs on port `3001` by default)
```bash
cd server
node index.js
```

---

## 📂 Project Structure

```
Visualizer/
├── public/                 # Static assets
├── server/                 # Node.js backend for multiplayer games
│   ├── index.js            # Server entry point & Socket.io logic
│   └── ...
├── src/
│   ├── Algorithms/         # Logic for sorting & pathfinding
│   ├── Components/         # Shared UI components (Navbar, etc.)
│   ├── Page/               # Application Pages
│   │   ├── Algorithm/      # Math & Algo viz (Pathfinding, Sorting, MST, Convex Hull, etc.)
│   │   ├── Games/          # Games and utils (Chess, TicTacToe, Sudoku, FlappyBird, Wordle Helper, etc.)
│   │   └── Home/           # Landing page
│   ├── App.js              # Main App component & Routing
│   └── index.js            # Entry point
└── ...
```

## 🤝 Contributing
Contributions are welcome! Whether it's adding a new algorithm, a new game, or improving the UI.
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
