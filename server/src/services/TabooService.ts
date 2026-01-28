import { forbiddenWordsCards, ForbiddenWordCard } from '../data/forbiddenWords';
import { TabooRoom, Player } from '../models/types';

class TabooService {
    private rooms: { [id: string]: TabooRoom };

    constructor() {
        this.rooms = {};
    }

    createRoom(name: string, socketId: string): string {
        let roomId: string;
        do {
            roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (this.rooms[roomId]);

        this.rooms[roomId] = {
            roomId, // Add roomId to state
            players: [{
                id: socketId,
                name: name || 'Host',
                score: 0,
                team: 'A' // Host is always Team A initially
            }],
            hostId: socketId,
            gameState: 'waiting',
            currentCard: null,
            timer: 60,
            usedCards: [],
            timerInterval: null,
            scores: { A: 0, B: 0 },
            currentTeam: 'A',
            giverId: null,
            settings: { roundTime: 60, totalRounds: 3, inputMode: 'button' },
            turnsPlayed: 0,
            turnScore: 0
        };

        return roomId;
    }

    joinRoom(roomId: string, name: string, socketId: string): TabooRoom {
        if (!this.rooms[roomId]) {
             this.rooms[roomId] = {
                roomId, // Add logic for implicit creation if needed
                players: [],
                hostId: socketId,
                gameState: 'waiting',
                currentCard: null,
                timer: 60,
                usedCards: [],
                timerInterval: null,
                scores: { A: 0, B: 0 },
                currentTeam: 'A',
                giverId: null,
                settings: { roundTime: 60, totalRounds: 3, inputMode: 'button' },
                turnsPlayed: 0,
                turnScore: 0
            };
        }

        const room = this.rooms[roomId];
        const existingPlayerByName = room.players.find(p => p.name === name);

        if (existingPlayerByName) {
            const oldId = existingPlayerByName.id;
            existingPlayerByName.id = socketId;
            existingPlayerByName.team = existingPlayerByName.team || 'A';
            if (room.hostId === oldId) room.hostId = socketId;
        } else {
            const existingPlayerById = room.players.find(p => p.id === socketId);
            if (!existingPlayerById) {
                const countA = room.players.filter(p => p.team === 'A').length;
                const countB = room.players.filter(p => p.team === 'B').length;
                const team = countA <= countB ? 'A' : 'B';

                room.players.push({
                    id: socketId,
                    name: name || `Player ${room.players.length + 1}`,
                    score: 0,
                    team: team
                });

                if (!room.hostId) room.hostId = socketId;
            }
        }
        return room;
    }

    getRoom(roomId: string): TabooRoom | undefined {
        return this.rooms[roomId];
    }

    switchTeam(roomId: string, playerId: string, team: string, socketId: string): TabooRoom | null {
        const room = this.rooms[roomId];
        if (!room) return null;

        const targetId = playerId || socketId;
        if (targetId !== socketId && room.hostId !== socketId) return null;

        const player = room.players.find(p => p.id === targetId);
        if (player) {
            if (team && ['A', 'B'].includes(team)) {
                player.team = team;
            } else {
                player.team = player.team === 'A' ? 'B' : 'A';
            }
        }
        return room;
    }

    updateSettings(roomId: string, settings: any, socketId: string): TabooRoom | null {
        const room = this.rooms[roomId];
        if (!room || room.hostId !== socketId) return null;

        room.settings = { ...room.settings, ...settings };
        return room;
    }

    randomizeTeams(roomId: string, socketId: string): TabooRoom | null {
        const room = this.rooms[roomId];
        if (!room || room.hostId !== socketId) return null;

        for (let i = room.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [room.players[i], room.players[j]] = [room.players[j], room.players[i]];
        }

        room.players.forEach((p, idx) => {
            p.team = idx % 2 === 0 ? 'A' : 'B';
        });

        return room;
    }

    startGame(roomId: string, socketId: string): TabooRoom | null {
        const room = this.rooms[roomId];
        if (!room || room.hostId !== socketId) return null;

        room.gameState = 'playing';
        room.scores = { A: 0, B: 0 };
        room.timer = room.settings?.roundTime || 60;
        room.usedCards = [];

        const host = room.players.find(p => p.id === room.hostId);
        room.currentTeam = host ? host.team! : 'A';
        room.turnsPlayed = 0;
        room.turnScore = 0;

        this.startTurn(roomId);
        return room;
    }

    calculateRound(room: TabooRoom): number {
        const playersA = room.players.filter(p => p.team === 'A').length;
        const playersB = room.players.filter(p => p.team === 'B').length;
        const turnsPerRound = Math.max(playersA, playersB, 1) * 2;
        return Math.floor(room.turnsPlayed / turnsPerRound) + 1;
    }

    startTurn(roomId: string): void {
        const room = this.rooms[roomId];
        room.turnScore = 0;
        
        const teamPlayers = room.players.filter(p => p.team === room.currentTeam);

        // Host First Rule
        if (room.turnsPlayed === 0 && room.hostId) {
            const hostPlayer = teamPlayers.find(p => p.id === room.hostId);
            if (hostPlayer) {
                room.giverId = hostPlayer.id;
                hostPlayer.timesGiver = (hostPlayer.timesGiver || 0) + 1;
                room.turnStatus = 'waiting';
                room.timer = room.settings?.roundTime || 60;
                return;
            }
        }

        // Standard Selection
        if (teamPlayers.length === 0) {
            room.currentTeam = room.currentTeam === 'A' ? 'B' : 'A';
            const otherTeamPlayers = room.players.filter(p => p.team === room.currentTeam);
            
            if (otherTeamPlayers.length === 0) return; // Empty room

            const minTimesGiver = Math.min(...otherTeamPlayers.map(p => p.timesGiver || 0));
            const candidates = otherTeamPlayers.filter(p => (p.timesGiver || 0) === minTimesGiver);
            const randomIdx = Math.floor(Math.random() * candidates.length);
            room.giverId = candidates[randomIdx].id;
            candidates[randomIdx].timesGiver = (candidates[randomIdx].timesGiver || 0) + 1;
        } else {
            const minTimesGiver = Math.min(...teamPlayers.map(p => p.timesGiver || 0));
            const candidates = teamPlayers.filter(p => (p.timesGiver || 0) === minTimesGiver);
            const randomIdx = Math.floor(Math.random() * candidates.length);
            room.giverId = candidates[randomIdx].id;
            candidates[randomIdx].timesGiver = (candidates[randomIdx].timesGiver || 0) + 1;
        }

        room.turnStatus = 'waiting';
        room.timer = room.settings?.roundTime || 60;
    }

    nextCard(roomId: string, onGameEnd?: (scores: any) => void): void {
        const room = this.rooms[roomId];
        if (!room) return;

        const availableCards = forbiddenWordsCards.filter(c => !room.usedCards.includes(c.word));
        if (availableCards.length === 0) {
            room.gameState = 'end';
            if (room.timerInterval) clearInterval(room.timerInterval);
            if (onGameEnd) onGameEnd(room.scores);
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const card = availableCards[randomIndex];
        room.currentCard = card;
        room.usedCards.push(card.word);
    }

    handleGameAction(roomId: string, action: string, socketId: string, onNextCard: any): TabooRoom | null {
        const room = this.rooms[roomId];
        if (!room || room.gameState !== 'playing') return null;

        const player = room.players.find(p => p.id === socketId);
        if (!player) return null;

        if (action === 'forbidden') {
            if (player.team === room.currentTeam || player.team === 'Spectator') return null;
            room.scores[room.currentTeam] -= 1;
            room.turnScore -= 1;
        } else if (['correct', 'skip'].includes(action)) {
            if (socketId !== room.giverId) return null;
            if (action === 'correct') {
                room.scores[room.currentTeam] += 1;
                room.turnScore += 1;
            }
        } else {
            return null;
        }

        this.nextCard(roomId, onNextCard);
        return room;
    }

    startTurnTimer(roomId: string, socketId: string, onTick: any, onSwitchTeams: any): TabooRoom | null {
        const room = this.rooms[roomId];
        if (!room || socketId !== room.giverId) return null;

        room.turnStatus = 'playing';
        room.timer = room.settings?.roundTime || 60;
        
        this.nextCard(roomId); // Ensure card is drawn

        if (room.timerInterval) clearInterval(room.timerInterval);
        
        room.timerInterval = setInterval(() => {
            room.timer -= 1;
            if (onTick) onTick(roomId, room.timer);

            if (room.timer <= 0) {
                clearInterval(room.timerInterval);
                this.switchTeams(roomId, onSwitchTeams);
            }
        }, 1000);

        return room;
    }

    switchTeams(roomId: string, onGameEnd: any): void {
        const room = this.rooms[roomId];
        if (!room) return;

        room.turnsPlayed = (room.turnsPlayed || 0) + 1;
        
        const playersA = room.players.filter(p => p.team === 'A').length;
        const playersB = room.players.filter(p => p.team === 'B').length;
        const turnsPerRound = Math.max(playersA, playersB, 1) * 2;
        const totalTurnsNeeded = turnsPerRound * room.settings.totalRounds;

        if (room.turnsPlayed >= totalTurnsNeeded) {
            room.gameState = 'end';
            if (onGameEnd) onGameEnd(room.scores);
            return;
        }

        room.currentTeam = room.currentTeam === 'A' ? 'B' : 'A';
        this.startTurn(roomId);
        // Important: Caller needs to emit update
        if (onGameEnd) onGameEnd(null); // Signal switch happened but not end
    }

    submitGuess(roomId: string, guess: string, socketId: string): { correct: boolean, team?: string } | null {
        const room = this.rooms[roomId];
        if (!room || room.gameState !== 'playing') return null;

        const cleanGuess = guess.trim().toLowerCase();
        const cleanTarget = room.currentCard ? room.currentCard.word.trim().toLowerCase() : '';

        if (cleanGuess === cleanTarget && cleanTarget) {
            room.scores[room.currentTeam] += 1;
            room.turnScore += 1;
            this.nextCard(roomId);
            return { correct: true, team: room.currentTeam };
        }
        return { correct: false, team: room.currentTeam };
    }
}

export default new TabooService();
