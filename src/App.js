import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Components/Layout';

import Home from "./Page/Home"

import Sort from "./Page/Sorting"
import PathFinding from "./Page/Pathfinding"
import CellularAutomata from './Page/CellularAutomata';

import Sudoku from './Page/Sudoku';
import ForbiddenWords from './Page/ForbiddenWords';
import FallingBlocks from './Page/FallingBlocks';
import Minesweeper from './Page/Minesweeper';
import FlappyBird from './Page/FlappyBird';
import TicTacToe from './Page/TicTacToe';
import Chess from './Page/Chess';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
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

          <Route path="/*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}