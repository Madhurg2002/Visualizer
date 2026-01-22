
const { v4: uuidv4 } = require('uuid');

const tictactoeRooms = {};

const setupTicTacToeHandlers = (io, socket) => {

    const emitRoomUpdate = (roomId) => {
        if (!tictactoeRooms[roomId]) return;
        io.to(roomId).emit('ttt_room_update', tictactoeRooms[roomId]);
    };

    const checkWinner = (squares) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return { winner: squares[a], line: lines[i] };
            }
        }
        return null;
    };

    const isDraw = (squares) => {
        return squares.every(square => square !== null) && !checkWinner(squares);
    };

    socket.on('ttt_create_room', ({ name }) => {
        let roomId;
        do {
            roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (tictactoeRooms[roomId]);

        tictactoeRooms[roomId] = {
            roomId,
            players: [{
                id: socket.id,
                name: name || 'Host',
                symbol: 'X', // Host is X
                score: 0
            }],
            board: Array(9).fill(null),
            currentTurn: 'X',
            winner: null,
            winningLine: null,
            gameState: 'waiting', // waiting, playing, end
            hostId: socket.id
        };

        socket.join(roomId);
        console.log(`[TTT] Room Created: ${roomId} by ${name}`);
        socket.emit('ttt_room_created', roomId);
        emitRoomUpdate(roomId);
    });

    socket.on('ttt_join_room', ({ name, roomId }) => {
        const room = tictactoeRooms[roomId];
        if (!room) {
            socket.emit('ttt_error', 'Room not found');
            return;
        }

        socket.join(roomId);

        // Reconnection check
        const existingPlayer = room.players.find(p => p.name === name);
        if (existingPlayer) {
            existingPlayer.id = socket.id;
            console.log(`[TTT] Reconnect: ${name} to ${roomId}`);
        } else if (room.players.length < 2) {
            room.players.push({
                id: socket.id,
                name: name || 'Player 2',
                symbol: 'O',
                score: 0
            });
            room.gameState = 'playing'; // Start immediately when 2nd player joins
            console.log(`[TTT] Player Joined: ${name} to ${roomId}`);
        } else {
            // Spectator?
            socket.emit('ttt_error', 'Room is full');
            return; // Or handle spectator logic later
        }

        emitRoomUpdate(roomId);
    });

    socket.on('ttt_move', ({ roomId, index }) => {
        const room = tictactoeRooms[roomId];
        if (!room || room.gameState !== 'playing' || room.winner) return;

        // Check if it's player's turn
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.symbol !== room.currentTurn) return;

        // Valid move?
        if (room.board[index]) return;

        // Make move
        room.board[index] = player.symbol;

        // Check Win/Draw
        const winData = checkWinner(room.board);
        if (winData) {
            room.winner = winData.winner;
            room.winningLine = winData.line;
            room.gameState = 'end';

            // Update score
            const winnerPlayer = room.players.find(p => p.symbol === winData.winner);
            if (winnerPlayer) winnerPlayer.score += 1;

        } else if (isDraw(room.board)) {
            room.winner = 'Draw';
            room.gameState = 'end';
        } else {
            // Switch Turn
            room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
        }

        emitRoomUpdate(roomId);
    });

    socket.on('ttt_reset', ({ roomId }) => {
        const room = tictactoeRooms[roomId];
        if (!room) return;

        // Only host? Or winner? Let's say anyone can request rematch for now
        room.board = Array(9).fill(null);
        room.winner = null;
        room.winningLine = null;
        room.currentTurn = 'X'; // Reset to X (or alternate?)
        room.gameState = 'playing';

        emitRoomUpdate(roomId);
    });

    // Clean up empty rooms or handle disconnects if needed...
    socket.on('disconnect', () => {
        // Optional: Pause game or notify 
    });

};

module.exports = { setupTicTacToeHandlers };
