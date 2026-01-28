import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import setupTabooHandlers from './handlers/tabooHandler';
import setupTicTacToeHandlers from './handlers/tictactoeHandler';
import setupChessHandlers from './handlers/chessHandler';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity, tighten in production
        methods: ["GET", "POST"]
    }
});

app.use(cors());

io.on('connection', (socket) => {
    // console.log(`User Connected: ${socket.id}`); // Logging removed per user request

    setupTabooHandlers(io, socket);
    setupTicTacToeHandlers(io, socket);
    setupChessHandlers(io, socket);

    socket.on('disconnect', () => {
        // console.log('User Disconnected', socket.id); // Logging removed
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
