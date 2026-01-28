import { TicTacToeRoom, Player } from '../models/types';

class TicTacToeService {
    private rooms: { [id: string]: TicTacToeRoom };

    constructor() {
        this.rooms = {};
    }

    createRoom(name: string, socketId: string): string {
        let roomId: string;
        do {
            roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (this.rooms[roomId]);

        this.rooms[roomId] = {
            roomId,
            players: [{
                id: socketId,
                name: name || 'Host',
                symbol: 'X',
                score: 0
            }],
            board: Array(9).fill(null),
            currentTurn: 'X',
            winner: null,
            winningLine: null,
            gameState: 'waiting',
            hostId: socketId
        };

        return roomId;
    }

    joinRoom(roomId: string, name: string, socketId: string): TicTacToeRoom {
        const room = this.rooms[roomId];
        if (!room) throw new Error('Room not found');

        // Reconnection
        const existingPlayer = room.players.find(p => p.name === name);
        if (existingPlayer) {
            existingPlayer.id = socketId;
        } else if (room.players.length < 2) {
            room.players.push({
                id: socketId,
                name: name || 'Player 2',
                symbol: 'O',
                score: 0
            });
            room.gameState = 'playing';
        } else {
             throw new Error('Room is full');
        }
        return room;
    }

    makeMove(roomId: string, index: number, socketId: string): TicTacToeRoom | null {
        const room = this.rooms[roomId];
        if (!room || room.gameState !== 'playing' || room.winner) return null;

        const player = room.players.find(p => p.id === socketId);
        if (!player || player.symbol !== room.currentTurn) return null;
        if (room.board[index]) return null;

        room.board[index] = player.symbol!; // symbol is optional in interface but required here

        const winData = this.checkWinner(room.board);
        if (winData) {
            room.winner = winData.winner;
            room.winningLine = winData.line;
            room.gameState = 'end';
            const winnerPlayer = room.players.find(p => p.symbol === winData.winner);
            if (winnerPlayer) winnerPlayer.score = (winnerPlayer.score || 0) + 1;
        } else if (this.isDraw(room.board)) {
            room.winner = 'Draw';
            room.gameState = 'end';
        } else {
            room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
        }

        return room;
    }

    resetGame(roomId: string): TicTacToeRoom | null {
        const room = this.rooms[roomId];
        if (!room) return null;

        room.board = Array(9).fill(null);
        room.winner = null;
        room.winningLine = null;
        room.currentTurn = 'X';
        room.gameState = 'playing';
        return room;
    }

    getRoom(roomId: string): TicTacToeRoom | undefined {
        return this.rooms[roomId];
    }

    checkWinner(squares: (string | null)[]) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return { winner: squares[a] as string, line: lines[i] };
            }
        }
        return null;
    }

    isDraw(squares: (string | null)[]) {
        return squares.every(square => square !== null) && !this.checkWinner(squares);
    }
}

export default new TicTacToeService();
