const { v4: uuidV4 } = require('uuid');

const rooms = new Map();

module.exports = (io, socket) => {
    // Create Room
    socket.on('chess_create_room', ({ playerName, timeControl }) => {
        const roomId = uuidV4().substring(0, 6).toUpperCase();
        rooms.set(roomId, {
            roomId,
            players: [{ id: socket.id, name: playerName, color: 'w' }], // Creator is White
            board: null,
            turn: 'w',
            gameState: 'waiting',
            spectators: [],
            timeControl: timeControl || 10, // Default 10 if missing
            whiteTime: (timeControl || 10) * 60,
            blackTime: (timeControl || 10) * 60
        });
        socket.join(roomId);
        socket.emit('chess_room_created', { roomId, color: 'w', timeControl });
        console.log(`[Chess] Room ${roomId} created by ${playerName} (TC: ${timeControl})`);
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
            turn: room.turn,
            timeControl: room.timeControl,
            whiteTime: room.whiteTime,
            blackTime: room.blackTime
        });

        console.log(`[Chess] ${playerName} joined room ${roomId}`);
    });

    // Make Move
    socket.on('chess_make_move', ({ roomId, move, boardState, gameState, turn, whiteTime, blackTime }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Sync state
        room.board = boardState;
        room.gameState = gameState;
        room.turn = turn;
        if (whiteTime !== undefined) room.whiteTime = whiteTime;
        if (blackTime !== undefined) room.blackTime = blackTime;

        // Broadcast to opponent
        socket.to(roomId).emit('chess_move_made', {
            move,
            board: boardState, // Full board sync for simplicity
            gameState,
            turn,
            whiteTime,
            blackTime
        });
    });

    // Claim Timeout
    socket.on('chess_claim_timeout', ({ roomId, loser }) => {
        const room = rooms.get(roomId);
        if (room) {
            room.gameState = 'timeout';
            io.to(roomId).emit('chess_game_over', { reason: 'timeout', winner: loser === 'w' ? 'b' : 'w' });
        }
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
