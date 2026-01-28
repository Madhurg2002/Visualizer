import { v4 as uuidV4 } from 'uuid';
import { ChessRoom, Player } from '../models/types';

class ChessService {
    private rooms: Map<string, ChessRoom>;

    constructor() {
        this.rooms = new Map();
    }

    createRoom(playerName: string, timeControl: number, socketId: string): ChessRoom {
        const roomId = uuidV4().substring(0, 6).toUpperCase();
        const room: ChessRoom = {
            roomId,
            players: [{ id: socketId, name: playerName, color: 'w' }], // Creator is White
            board: null,
            turn: 'w',
            gameState: 'waiting',
            spectators: [],
            timeControl: timeControl || 10, // Default 10 if missing
            whiteTime: (timeControl || 10) * 60,
            blackTime: (timeControl || 10) * 60
        };
        this.rooms.set(roomId, room);
        return room;
    }

    joinRoom(roomId: string, playerName: string, socketId: string): ChessRoom {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        if (room.players.length >= 2) {
            throw new Error('Room is full');
        }

        const color = 'b'; // Joiner is Black
        const player: Player = { id: socketId, name: playerName, color };
        room.players.push(player);
        room.gameState = 'playing';
        
        return room;
    }

    getRoom(roomId: string): ChessRoom | undefined {
        return this.rooms.get(roomId);
    }

    updateGame(roomId: string, updates: Partial<ChessRoom>): ChessRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        // Sync state
        if (updates.board !== undefined) room.board = updates.board;
        if (updates.gameState !== undefined) room.gameState = updates.gameState;
        if (updates.turn !== undefined) room.turn = updates.turn;
        if (updates.whiteTime !== undefined) room.whiteTime = updates.whiteTime;
        if (updates.blackTime !== undefined) room.blackTime = updates.blackTime;

        return room;
    }

    claimTimeout(roomId: string, loser: string): { winner: string } | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        room.gameState = 'timeout';
        return {
            winner: loser === 'w' ? 'b' : 'w'
        };
    }

    restartGame(roomId: string): ChessRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        // Reset State
        room.board = null;
        room.turn = 'w';
        room.gameState = 'playing';
        room.whiteTime = (room.timeControl || 10) * 60;
        room.blackTime = (room.timeControl || 10) * 60;

        return room;
    }

    findPlayerInRooms(socketId: string): string[] {
        const affectedRooms: string[] = [];
        this.rooms.forEach((room, roomId) => {
            const index = room.players.findIndex(p => p.id === socketId);
            if (index !== -1) {
                room.players.splice(index, 1);
                affectedRooms.push(roomId);
                // Clean up empty rooms if needed, or handle in the handler
                if (room.players.length === 0) {
                    this.rooms.delete(roomId);
                }
            }
        });
        return affectedRooms;
    }
    
    getPlayer(roomId: string, socketId: string): Player | undefined {
        const room = this.rooms.get(roomId);
        if (!room) return undefined;
        return room.players.find(p => p.id === socketId);
    }
}

export default new ChessService();
