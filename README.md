# Visualizer & Games Platform

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

A comprehensive interactive platform that combines educational algorithm visualizations with engaging puzzle and party games. Built with **React** for a dynamic frontend and **Node.js** for real-time multiplayer experiences.

🚀 **Live Demo:** [visualiz.vercel.app](https://visualiz.vercel.app)

---

## 🚀 Features

#### 🧠 Algorithm Visualizers
Interactive visualizations to help understand complex algorithms step-by-step:
*   **Pathfinding Algorithms**:
    *   **Dijkstra's Algorithm**: Guarantees the shortest path.
    *   **A* Search**: Uses heuristics for faster pathfinding.
    *   **Breadth-First Search (BFS)**: Unweighted shortest path.
    *   **Depth-First Search (DFS)**: Explores as far as possible along each branch.
*   **Sorting Algorithms**:
    *   Visualize classic sorting methods like **Bubble Sort**, **Merge Sort**, **Quick Sort**, **Selection Sort**, and more.
    *   Adjustable speed and array size.
*   **Cellular Automata**:
    *   **Conway's Game of Life**: A zero-player game determining the state of cells based on specific rules.

#### 🎮 Games
A collection of logic puzzles and arcade-style games:
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
git clone https://github.com/Madhurg2002/Visualizer.git
cd Visualizer
```

#### 2. Install Frontend Dependencies
```bash
yarn install
# or
npm install
```

#### 3. Install Backend Dependencies
Required for the Online Forbidden Words game.
```bash
cd server
npm install
cd ..
```

---

## 🏃 Usage

### Start the Client (Frontend)
Runs the React application in development mode.
```bash
yarn start
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Start the Server (Backend)
Required for online multiplayer features.
```bash
cd server
node index.js
```
The server runs on port `3001` by default.

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
│   │   ├── CellularAutomata/
│   │   ├── FallingBlocks/
│   │   ├── FlappyBird/
│   │   ├── ForbiddenWords/ # Multiplayer game logic
│   │   ├── Home/
│   │   ├── Minesweeper/
│   │   ├── Pathfinding/
│   │   ├── Sorting/
│   │   └── Sudoku/
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
