import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import ChessMenu from './ChessMenu';
import ChessGame from './ChessGame';
import ChessOnline from './Online';

const ChessRoutes = () => {
    const navigate = useNavigate();
    return (
        <Routes>
            <Route index element={<ChessMenu />} />
            <Route path="local" element={<ChessGame />} />
            <Route path="ai" element={<ChessGame />} />
            <Route path="analysis" element={<ChessGame />} />
            <Route path="online" element={<ChessOnline onBack={() => navigate('/Chess')} />} />
        </Routes>
    );
}

export default ChessRoutes;
