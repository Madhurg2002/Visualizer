const { tabooCards } = require('./data');
const fs = require('fs');

const logToFile = (msg) => {
    try {
        const logLine = `[${new Date().toISOString()}] ${msg}\n`;
        fs.appendFileSync('server_debug.log', logLine);
    } catch (e) {
        console.error("Logging failed", e);
    }
};

const rooms = {};

const setupTabooHandlers = (io, socket) => {

    socket.on('join_room', ({ name, roomId }) => {
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: [],
                hostId: socket.id, // First player is host
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

        const room = rooms[roomId];

        // Check for existing player by NAME (Handle Reconnection)
        const existingPlayerByName = room.players.find(p => p.name === name);

        if (existingPlayerByName) {
            // Update ID of existing player (Reconnection)
            const oldId = existingPlayerByName.id;
            existingPlayerByName.id = socket.id;
            existingPlayerByName.team = existingPlayerByName.team || 'A'; // Ensure team is set

            // If they were host, update hostId
            if (room.hostId === oldId) {
                room.hostId = socket.id;
            }
            console.log(`[${roomId}] Player Reconnected: ${name} (Old: ${oldId} -> New: ${socket.id})`);
        } else {
            // New Player
            const existingPlayerById = room.players.find(p => p.id === socket.id);
            if (!existingPlayerById) {
                // Balance teams
                const countA = room.players.filter(p => p.team === 'A').length;
                const countB = room.players.filter(p => p.team === 'B').length;
                const team = countA <= countB ? 'A' : 'B';

                room.players.push({
                    id: socket.id,
                    name: name || `Player ${room.players.length + 1}`,
                    score: 0,
                    team: team
                });

                // If host left and this is first new player, or just safety
                if (!room.hostId) room.hostId = socket.id;
            }
        }

        emitRoomUpdate(io, roomId);
    });

    socket.on('switch_team', ({ roomId, team, playerId }) => {
        const room = rooms[roomId];
        if (!room) return;

        const targetId = playerId || socket.id;

        // If trying to move someone else, must be host
        if (targetId !== socket.id && room.hostId !== socket.id) return;

        const player = room.players.find(p => p.id === targetId);
        if (player) {
            if (team && ['A', 'B'].includes(team)) {
                player.team = team;
            } else {
                // Toggle fallback logic for A/B only (personal click)
                player.team = player.team === 'A' ? 'B' : 'A';
            }
            emitRoomUpdate(io, roomId);
        }
    });

    socket.on('update_settings', ({ roomId, settings }) => {
        const room = rooms[roomId];
        if (!room) return;

        // Host check
        if (room.hostId !== socket.id) return;

        // Merge settings
        room.settings = { ...room.settings, ...settings };
        emitRoomUpdate(io, roomId);
    });

    socket.on('randomize_teams', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;

        // Host check
        if (room.hostId !== socket.id) return;

        // Shuffle players
        for (let i = room.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [room.players[i], room.players[j]] = [room.players[j], room.players[i]];
        }

        // Assign balanced
        room.players.forEach((p, idx) => {
            p.team = idx % 2 === 0 ? 'A' : 'B';
        });

        emitRoomUpdate(io, roomId);
    });

    socket.on('start_game', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;

        // Host check
        if (room.hostId !== socket.id) return;

        room.gameState = 'playing';
        room.scores = { A: 0, B: 0 };
        room.timer = room.settings?.roundTime || 60;
        room.usedCards = [];

        const host = room.players.find(p => p.id === room.hostId);
        room.currentTeam = host ? host.team : 'A';

        room.turnsPlayed = 0;
        room.turnScore = 0;

        startTurn(io, roomId);
    });

    socket.on('game_action', ({ roomId, action }) => {
        const room = rooms[roomId];
        if (!room || room.gameState !== 'playing') return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        if (action === 'taboo') {
            // Allowed for Opponents
            if (player.team === room.currentTeam || player.team === 'Spectator') return;

            room.scores[room.currentTeam] -= 1; // Allow negative scores
            room.turnScore -= 1;
        }
        else if (['correct', 'skip'].includes(action)) {
            // Only Giver can mark correct or skip
            if (socket.id !== room.giverId) return;

            if (action === 'correct') {
                room.scores[room.currentTeam] += 1;
                room.turnScore += 1;
            }
        } else {
            return;
        }

        // Next card
        nextCard(io, roomId);
    });

    socket.on('start_turn_timer', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room || socket.id !== room.giverId) return;

        room.turnStatus = 'playing';
        emitRoomUpdate(io, roomId);

        room.timer = room.settings?.roundTime || 60;

        // Pick first card
        // nextCard already moves to next, we just need to ensure currentCard is set if it was null?
        // Actually nextCard draws a card.
        // In startTurn we PAUSE before nextCard.
        nextCard(io, roomId);

        // Start Timer
        if (room.timerInterval) clearInterval(room.timerInterval);
        room.timerInterval = setInterval(() => {
            room.timer -= 1;
            io.to(roomId).emit('timer_update', room.timer);

            if (room.timer <= 0) {
                clearInterval(room.timerInterval);
                switchTeams(io, roomId);
            }
        }, 1000);
    });

    socket.on('submit_guess', ({ roomId, guess }) => {
        const room = rooms[roomId];
        if (!room || room.gameState !== 'playing') return;

        // Normalize
        const cleanGuess = guess.trim().toLowerCase();
        const cleanTarget = room.currentCard.word.trim().toLowerCase();

        if (cleanGuess === cleanTarget) {
            // Correct!
            room.scores[room.currentTeam] += 1;
            room.turnScore += 1;
            io.to(roomId).emit('guess_result', { correct: true, guess: guess, team: room.currentTeam });
            nextCard(io, roomId);
        } else {
            // Optional: emit incorrect guess to chat or UI
            io.to(roomId).emit('guess_result', { correct: false, guess: guess, team: room.currentTeam });
        }
    });
};

function emitRoomUpdate(io, roomId) {
    const room = rooms[roomId];
    if (!room) return;
    io.to(roomId).emit('room_update', {
        players: room.players,
        gameState: room.gameState,
        turnStatus: room.turnStatus,
        scores: room.scores,
        currentTeam: room.currentTeam,
        giverId: room.giverId,
        timer: room.timer,
        hostId: room.hostId,
        settings: room.settings,
        turnScore: room.turnScore || 0,
        currentRound: calculateRound(room),
        totalRounds: room.settings.totalRounds
    });
}

function calculateRound(room) {
    const playersA = room.players.filter(p => p.team === 'A').length;
    const playersB = room.players.filter(p => p.team === 'B').length;
    const turnsPerRound = Math.max(playersA, playersB, 1) * 2;
    return Math.floor(room.turnsPlayed / turnsPerRound) + 1;
}

function startTurn(io, roomId) {
    const room = rooms[roomId];
    room.turnScore = 0;
    console.log(`[${roomId}] Starting turn. Current Team: ${room.currentTeam}`);

    // Pick a giver from currentTeam
    // Fair Giver Selection (Round Robin)
    const teamPlayers = room.players.filter(p => p.team === room.currentTeam);

    // Host First Rule
    if (room.turnsPlayed === 0 && room.hostId) {
        const hostPlayer = teamPlayers.find(p => p.id === room.hostId);
        if (hostPlayer) {
            console.log(`[${roomId}] First turn: Forcing Host ${hostPlayer.name} as Giver.`);
            room.giverId = hostPlayer.id;
            hostPlayer.timesGiver = (hostPlayer.timesGiver || 0) + 1;

            // Skip the standard selection logic
            room.turnStatus = 'waiting';
            room.timer = room.settings?.roundTime || 60;
            emitRoomUpdate(io, roomId);
            return;
        }
    }

    // Standard Selection Logic
    // Find players who have been giver the FEWEST times

    if (teamPlayers.length === 0) {
        console.log(`[${roomId}] No players in Team ${room.currentTeam}. Switching...`);
        room.currentTeam = room.currentTeam === 'A' ? 'B' : 'A';
        const otherTeamPlayers = room.players.filter(p => p.team === room.currentTeam);

        if (otherTeamPlayers.length === 0) {
            console.log(`[${roomId}] No players in EITHER team.`);
            return;
        }

        // Selection Logic for fallback team
        const minTimesGiver = Math.min(...otherTeamPlayers.map(p => p.timesGiver || 0));
        const candidates = otherTeamPlayers.filter(p => (p.timesGiver || 0) === minTimesGiver);
        const randomIdx = Math.floor(Math.random() * candidates.length);
        room.giverId = candidates[randomIdx].id;

        // Update count
        candidates[randomIdx].timesGiver = (candidates[randomIdx].timesGiver || 0) + 1;

    } else {
        const minTimesGiver = Math.min(...teamPlayers.map(p => p.timesGiver || 0));
        const candidates = teamPlayers.filter(p => (p.timesGiver || 0) === minTimesGiver);
        const randomIdx = Math.floor(Math.random() * candidates.length);
        room.giverId = candidates[randomIdx].id;

        // Update count
        candidates[randomIdx].timesGiver = (candidates[randomIdx].timesGiver || 0) + 1;
        console.log(`[${roomId}] Selected Giver: ${room.giverId} from team ${room.currentTeam}`);
    }

    // Set state to waiting for giver to confirm
    room.turnStatus = 'waiting';
    room.timer = room.settings?.roundTime || 60;

    // Do NOT draw card or start timer yet.
    // Ensure card is hidden/cleared if needed? 
    // Ideally user UI will hide it if turnStatus != 'playing'

    emitRoomUpdate(io, roomId);
}

function switchTeams(io, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.turnsPlayed = (room.turnsPlayed || 0) + 1;
    console.log(`[${roomId}] Switching teams. Turns played: ${room.turnsPlayed}. Total needed: ${room.settings.totalRounds * 2}`);

    // Dynamic Round Length: 1 Round = Everyone goes once (based on larger team)
    // Dynamic Round Length: 1 Round = Everyone goes once (based on larger team)
    const playersA = room.players.filter(p => p.team === 'A').length;
    const playersB = room.players.filter(p => p.team === 'B').length;
    const turnsPerRound = Math.max(playersA, playersB, 1) * 2; // *2 for A and B turns
    const totalTurnsNeeded = turnsPerRound * room.settings.totalRounds;

    logToFile(`[${roomId}] DEBUG SWITCH: TurnsPlayed: ${room.turnsPlayed}, PlayersA: ${playersA}, PlayersB: ${playersB}, Limit: ${totalTurnsNeeded}`);

    if (room.turnsPlayed >= totalTurnsNeeded) {
        logToFile(`[${roomId}] GAME END TRIGGERED: ${room.turnsPlayed} >= ${totalTurnsNeeded}`);
        room.gameState = 'end';
        io.to(roomId).emit('game_end', { scores: room.scores });
        return;
    }

    room.currentTeam = room.currentTeam === 'A' ? 'B' : 'A';
    startTurn(io, roomId);
}

function nextCard(io, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    const availableCards = tabooCards.filter(c => !room.usedCards.includes(c.word));
    if (availableCards.length === 0) {
        // Game Over or Reshuffle
        room.gameState = 'end';
        if (room.timerInterval) clearInterval(room.timerInterval);
        io.to(roomId).emit('game_end', { scores: room.scores });
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards[randomIndex];
    room.currentCard = card;
    room.usedCards.push(card.word);

    // Emit FULL update to keep everyone synced
    io.to(roomId).emit('game_state_update', {
        currentCard: room.currentCard,
        scores: room.scores,
        gameState: room.gameState,
        giverId: room.giverId,
        currentTeam: room.currentTeam,
        turnScore: room.turnScore,
        currentRound: calculateRound(room),
        totalRounds: room.settings.totalRounds
    });
}

module.exports = { setupTabooHandlers };
