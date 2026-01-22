const { v4: uuidV4 } = require('uuid');

const rooms = new Map();

module.exports = (io, socket) => {
    // Create Room
    socket.on('chess_create_room', ({ playerName }) => {
        const roomId = uuidV4().substring(0, 6).toUpperCase();
        rooms.set(roomId, {
            roomId,
            players: [{ id: socket.id, name: playerName, color: 'w' }], // Creator is White
            board: null, // Will init on start
            turn: 'w',
            gameState: 'waiting', // waiting, playing, check, checkmate, stalemate
            spectators: []
        });
        socket.join(roomId);
        socket.emit('chess_room_created', { roomId, color: 'w' });
        console.log(`[Chess] Room ${roomId} created by ${playerName}`);
    });

    // Join Room
    socket.on('chess_join_room', ({ roomId, playerName }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('chess_error', { message: 'Room not found' });
            return;
        }

        if (room.players.length >= 2) {
            socket.emit('chess_error', { message: 'Room is full' });
            return;
        }

        const color = 'b'; // Joiner is Black
        room.players.push({ id: socket.id, name: playerName, color });
        room.gameState = 'playing';
        socket.join(roomId);

        // Notify creator
        io.to(roomId).emit('chess_player_joined', {
            players: room.players,
            gameState: 'playing',
            turn: room.turn
        });

        console.log(`[Chess] ${playerName} joined room ${roomId}`);
    });

    // Make Move
    socket.on('chess_make_move', ({ roomId, move, boardState, gameState, turn }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Basic validation could go here, but relying on client logic for custom engine
        // Sync state
        room.board = boardState;
        room.gameState = gameState;
        room.turn = turn;

        // Broadcast to opponent
        socket.to(roomId).emit('chess_move_made', {
            move,
            board: boardState, // Full board sync for simplicity
            gameState,
            turn
        });
    });

    // Rematch
    socket.on('chess_restart', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room) {
            io.to(roomId).emit('chess_restart_game');
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        // Cleanup logic similar to other handlers
        rooms.forEach((room, roomId) => {
            const index = room.players.findIndex(p => p.id === socket.id);
            if (index !== -1) {
                room.players.splice(index, 1);
                io.to(roomId).emit('chess_player_left');
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                }
            }
        });
    });
};
