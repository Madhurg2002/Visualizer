import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Components/Layout';

import Sort from "./Page/Sorting"
import Home from "./Page/Home"
import PathFinding from "./Page/Pathfinding"
import Sudoku from './Page/Sudoku';
import CellularAutomata from './Page/CellularAutomata';
import Tetris from './Page/Tetris';
import Minesweeper from './Page/Minesweeper';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route exact path="/home" element={<Home />} />
          <Route exact path="/sort" element={<Sort />} />
          <Route exact path="/Sudoku" element={<Sudoku />} />
          <Route exact path="/PathFinding" element={<PathFinding />} />
          <Route exact path="/CellularAutomata" element={<CellularAutomata />} />
          <Route exact path="/Tetris" element={<Tetris />} />
          <Route exact path="/Minesweeper" element={<Minesweeper />} />
          <Route path="/*" element={<Navigate to="/home" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}