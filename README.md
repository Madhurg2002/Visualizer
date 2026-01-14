# Visualizer & Games Platform

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

A comprehensive interactive platform visualizing classic algorithms and hosting engaging puzzle/party games. Built with React.js for the frontend and Node.js for real-time multiplayer features.

## 🚀 Features

### 🧠 Algorithm Visualizers
Visualize complex algorithms to understand how they work under the hood:
*   **Sorting Algorithms**: Bubble Sort, Merge Sort, Quick Sort, Selection Sort, etc.
*   **Pathfinding**: Dijkstra, A* Search, BFS, DFS.
*   **Cellular Automata**: Conway's Game of Life.

### 🎮 Games
A collection of logic puzzles and party games:
*   **Taboo (New!)**:
    *   **Online Multiplayer**: Play with friends remotely using real-time Socket.IO connection. Features custom rooms, lobby system, and team management.
    *   **Local Party**: Pass-and-play mode for in-person gatherings.
*   **Sudoku**: Classic number placement puzzle. Features reproducible boards via **seed-based generation** and backtracking visualization.
*   **Flappy Bird**: A clone of the famous arcade game. Test your reflexes!
*   **Minesweeper**: Classic strategy game. Clear the board without detonating mines.
*   **Tetris**: The block-stacking classic. Clear lines to score points.

## 🛠️ Tech Stack

*   **Frontend**: React.js, Tailwind CSS, Framer Motion
*   **Backend**: Node.js, Express, Socket.IO (for Multiplayer Taboo)
*   **State Management**: React Hooks (useContext, useReducer)

## 📦 Getting Started

### Prerequisites
*   Node.js (v14+)
*   Yarn or npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Madhurg2002/Visualizer.git
    cd Visualizer
    ```

2.  **Install Frontend Dependencies**
    ```bash
    yarn install
    # or
    npm install
    ```

### Running the Application

#### 1. Start the Frontend
Runs the React app in development mode.
```bash
yarn start
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### 2. Start the Backend Server (Required for Online Taboo)
The backend handles real-time game state for the Online Taboo mode.
```bash
cd server
npm install # Install server dependencies if first time
node index.js
```
The server typically runs on port `3001` or as defined in your `.env`.

## 📂 Project Structure

*   `src/Components`: Reusable UI components (Navbar, Sidebar, shared inputs).
*   `src/Page`: Distinct pages for each Visualizer and Game (e.g., `Home`, `Taboo`, `Sudoku`).
*   `server`: Node.js backend for socket connections.
*   `src/Algorithms`: Core logic for sorting and pathfinding algorithms.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
