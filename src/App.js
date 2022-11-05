// import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Sort from "./Page/Sort"
import Home from "./Page/Home"
import PathFinding from "./Page/Pathfinding"
import Sudoku from './Page/Sudoku';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/home" element={<Home />} />
        <Route exact path="/sort" element={<Sort />} />
        <Route exact path="/Sudoku" element={<Sudoku />} />
        <Route exact path="/PathFinding" element={<PathFinding />} />
        <Route path="/*" element={<Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  );
}