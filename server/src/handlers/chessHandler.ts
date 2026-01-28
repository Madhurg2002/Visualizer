import { Server, Socket } from 'socket.io';
import chessService from '../services/ChessService';
import { ChessRoom } from '../models/types';

export default (io: Server, socket: Socket) => {
    // Create Room
    socket.on('chess_create_room', ({ playerName, timeControl }: { playerName: string, timeControl: number }) => {
        try {
            const room = chessService.createRoom(playerName, timeControl, socket.id);
            socket.join(room.roomId);
            socket.emit('chess_room_created', { roomId: room.roomId, color: 'w', timeControl: room.timeControl });
            console.log(`[Chess] Room ${room.roomId} created by ${playerName} (TC: ${room.timeControl})`);
        } catch (error: any) {
            console.error(error);
            socket.emit('chess_error', { message: 'Failed to create room' });
        }
    });

    // Join Room
    socket.on('chess_join_room', ({ roomId, playerName }: { roomId: string, playerName: string }) => {
        try {
            const room = chessService.joinRoom(roomId, playerName, socket.id);
            socket.join(roomId);

            // Notify creator and joiner
            io.to(roomId).emit('chess_player_joined', {
                players: room.players,
                gameState: room.gameState,
                turn: room.turn,
                timeControl: room.timeControl,
                whiteTime: room.whiteTime,
                blackTime: room.blackTime
            });

            console.log(`[Chess] ${playerName} joined room ${roomId}`);
        } catch (error: any) {
            console.error(`[Chess] Error joining room ${roomId}:`, error.message);
            socket.emit('chess_error', { message: error.message });
        }
    });

    // Make Move
    socket.on('chess_make_move', ({ roomId, move, boardState, gameState, turn, whiteTime, blackTime }: any) => {
        const room = chessService.updateGame(roomId, { board: boardState, gameState, turn, whiteTime, blackTime });

        if (room) {
            // Broadcast to opponent
            socket.to(roomId).emit('chess_move_made', {
                move,
                board: boardState,
                gameState,
                turn,
                whiteTime,
                blackTime
            });
        }
    });

    // Claim Timeout
    socket.on('chess_claim_timeout', ({ roomId, loser }: { roomId: string, loser: string }) => {
        const result = chessService.claimTimeout(roomId, loser);
        if (result) {
            io.to(roomId).emit('chess_game_over', { reason: 'timeout', winner: result.winner });
        }
    });

    // Rematch
    socket.on('chess_restart', ({ roomId }: { roomId: string }) => {
        const room = chessService.restartGame(roomId);
        if (room) {
            io.to(roomId).emit('chess_restart_game', {
                whiteTime: room.whiteTime,
                blackTime: room.blackTime
            });
        }
    });

    // Chat
    socket.on('chess_send_message', ({ roomId, message }: { roomId: string, message: string }) => {
        const player = chessService.getPlayer(roomId, socket.id);
        if (player) {
            const msgPayload = {
                sender: player.name,
                color: player.color,
                text: message,
                timestamp: new Date().toISOString()
            };
            io.to(roomId).emit('chess_new_message', msgPayload);
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        const affectedRooms = chessService.findPlayerInRooms(socket.id);
        affectedRooms.forEach(roomId => {
            io.to(roomId).emit('chess_player_left');
        });
    });
};
