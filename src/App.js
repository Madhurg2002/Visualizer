import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Components/Layout';
import Loading from './Components/Loading';
import React, { Suspense, lazy } from 'react';
import { ALGORITHMS, GAMES } from './data/visualizers';

const Home = lazy(() => import("./Page/Home"));

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route exact path="/" element={<Home />} />

            {/* Algorithms */}
            {ALGORITHMS.map(route => (
                <Route 
                    key={route.path} 
                    path={route.path} 
                    element={<route.component />} 
                />
            ))}

            {/* Games */}
            {GAMES.map(route => (
                <Route 
                    key={route.path} 
                    path={route.path} 
                    element={<route.component />} 
                />
            ))}

            <Route path="/*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}