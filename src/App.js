import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Components/Layout';
import Loading from './Components/Loading';
import React, { Suspense, lazy } from 'react';

const Home = lazy(() => import("./Page/Home"));
const Sort = lazy(() => import("./Page/Sorting"));
const PathFinding = lazy(() => import("./Page/Pathfinding"));
const CellularAutomata = lazy(() => import('./Page/CellularAutomata'));
const Sudoku = lazy(() => import('./Page/Sudoku'));
const ForbiddenWords = lazy(() => import('./Page/ForbiddenWords'));
const FallingBlocks = lazy(() => import('./Page/FallingBlocks'));
const Minesweeper = lazy(() => import('./Page/Minesweeper'));
const FlappyBird = lazy(() => import('./Page/FlappyBird'));
const TicTacToe = lazy(() => import('./Page/TicTacToe'));
const Chess = lazy(() => import('./Page/Chess'));
const KineticClock = lazy(() => import('./Page/KineticClock'));
const NQueens = lazy(() => import('./Page/NQueens'));
const PrimeSpirals = lazy(() => import('./Page/PrimeSpirals'));
const ConvexHull = lazy(() => import('./Page/ConvexHull'));
const MST = lazy(() => import('./Page/MST'));
const Pendulum = lazy(() => import('./Page/Pendulum/Pendulum'));

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route exact path="/" element={<Home />} />

            <Route exact path="/sort" element={<Sort />} />
            <Route exact path="/PathFinding" element={<PathFinding />} />
            <Route exact path="/CellularAutomata" element={<CellularAutomata />} />

            <Route exact path="/Sudoku" element={<Sudoku />} />
            <Route path="/ForbiddenWords/*" element={<ForbiddenWords />} />
            <Route exact path="/FallingBlocks" element={<FallingBlocks />} />
            <Route exact path="/Minesweeper" element={<Minesweeper />} />
            <Route exact path="/FlappyBird" element={<FlappyBird />} />
            <Route path="/TicTacToe/*" element={<TicTacToe />} />
            <Route path="/Chess/*" element={<Chess />} />
            <Route exact path="/KineticClock" element={<KineticClock />} />
            <Route exact path="/nqueens" element={<NQueens />} />
            <Route exact path="/prime-spirals" element={<PrimeSpirals />} />
            <Route exact path="/convex-hull" element={<ConvexHull />} />
            <Route exact path="/mst" element={<MST />} />
            <Route exact path="/pendulum" element={<Pendulum />} />

            <Route path="/*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}