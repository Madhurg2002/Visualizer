import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Components/Layout';
import Loading from './Components/Loading';
import React, { Suspense, lazy } from 'react';

const Home = lazy(() => import("./Page/Home"));
const Sort = lazy(() => import("./Page/Algorithm/Sorting"));
const PathFinding = lazy(() => import("./Page/Algorithm/Pathfinding"));
const CellularAutomata = lazy(() => import('./Page/Algorithm/CellularAutomata'));
const Sudoku = lazy(() => import('./Page/Games/Sudoku'));
const ForbiddenWords = lazy(() => import('./Page/Games/ForbiddenWords'));
const FallingBlocks = lazy(() => import('./Page/Games/FallingBlocks'));
const Minesweeper = lazy(() => import('./Page/Games/Minesweeper'));
const FlappyBird = lazy(() => import('./Page/Games/FlappyBird'));
const TicTacToe = lazy(() => import('./Page/Games/TicTacToe'));
const Chess = lazy(() => import('./Page/Games/Chess'));
const KineticClock = lazy(() => import('./Page/Games/KineticClock'));
const NQueens = lazy(() => import('./Page/Algorithm/NQueens'));
const PrimeSpirals = lazy(() => import('./Page/Algorithm/PrimeSpirals'));
const ConvexHull = lazy(() => import('./Page/Algorithm/ConvexHull'));
const MST = lazy(() => import('./Page/Algorithm/MST'));
const Pendulum = lazy(() => import('./Page/Algorithm/Pendulum/Pendulum'));
const WordleHelper = lazy(() => import('./Page/Games/WordleHelper'));

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route exact path="/" element={<Home />} />

            {/*Algorithms*/}
            <Route exact path="/CellularAutomata" element={<CellularAutomata />} />
            <Route exact path="/convex-hull" element={<ConvexHull />} />
            <Route exact path="/KineticClock" element={<KineticClock />} />
            <Route exact path="/mst" element={<MST />} />
            <Route exact path="/nqueens" element={<NQueens />} />
            <Route exact path="/sort" element={<Sort />} />
            <Route exact path="/PathFinding" element={<PathFinding />} />
            <Route exact path="/pendulum" element={<Pendulum />} />
            <Route exact path="/prime-spirals" element={<PrimeSpirals />} />

            {/*Games*/}
            <Route path="/Chess/*" element={<Chess />} />
            <Route path="/ForbiddenWords/*" element={<ForbiddenWords />} />
            <Route exact path="/FallingBlocks" element={<FallingBlocks />} />
            <Route exact path="/FlappyBird" element={<FlappyBird />} />
            <Route exact path="/Minesweeper" element={<Minesweeper />} />
            <Route exact path="/Sudoku" element={<Sudoku />} />
            <Route path="/TicTacToe/*" element={<TicTacToe />} />
            <Route exact path="/wordle-helper" element={<WordleHelper />} />

            <Route path="/*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}