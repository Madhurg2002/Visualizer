import { Server, Socket } from 'socket.io';
import tictactoeService from '../services/TicTacToeService';

const emitRoomUpdate = (io: Server, roomId: string) => {
    const room = tictactoeService.getRoom(roomId);
    if (room) {
        io.to(roomId).emit('ttt_room_update', room);
    }
};

export default (io: Server, socket: Socket) => {
    socket.on('ttt_create_room', ({ name }: { name: string }) => {
        const roomId = tictactoeService.createRoom(name, socket.id);
        socket.join(roomId);
        console.log(`[TTT] Room Created: ${roomId} by ${name}`);
        socket.emit('ttt_room_created', roomId);
        emitRoomUpdate(io, roomId);
    });

    socket.on('ttt_join_room', ({ name, roomId }: { name: string, roomId: string }) => {
        try {
            const room = tictactoeService.joinRoom(roomId, name, socket.id);
            socket.join(roomId);
            console.log(`[TTT] ${name} joined ${roomId}`);
            emitRoomUpdate(io, roomId);
        } catch (error: any) {
            socket.emit('ttt_error', error.message);
        }
    });

    socket.on('ttt_move', ({ roomId, index }: { roomId: string, index: number }) => {
        const room = tictactoeService.makeMove(roomId, index, socket.id);
        if (room) {
            emitRoomUpdate(io, roomId);
        }
    });

    socket.on('ttt_reset', ({ roomId }: { roomId: string }) => {
        const room = tictactoeService.resetGame(roomId);
        if (room) {
            emitRoomUpdate(io, roomId);
        }
    });
};
