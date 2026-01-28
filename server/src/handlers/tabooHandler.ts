import { Server, Socket } from 'socket.io';
import tabooService from '../services/TabooService';
import { TabooRoom } from '../models/types';

const emitRoomUpdate = (io: Server, roomId: string) => {
    const room = tabooService.getRoom(roomId);
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
        currentRound: tabooService.calculateRound(room),
        totalRounds: room.settings.totalRounds
    });
};

const emitGameStateUpdate = (io: Server, roomId: string) => {
    const room = tabooService.getRoom(roomId);
    if (!room) return;

    io.to(roomId).emit('game_state_update', {
        currentCard: room.currentCard,
        scores: room.scores,
        gameState: room.gameState,
        giverId: room.giverId,
        currentTeam: room.currentTeam,
        turnScore: room.turnScore,
        currentRound: tabooService.calculateRound(room),
        totalRounds: room.settings.totalRounds,
        settings: room.settings
    });
};

export default (io: Server, socket: Socket) => {
    socket.on('create_room', ({ name }: { name: string }) => {
        const roomId = tabooService.createRoom(name, socket.id);
        socket.join(roomId);
        console.log(`[Taboo] Room Created: ${roomId} by ${name}`);
        socket.emit('room_created', roomId);
        emitRoomUpdate(io, roomId);
    });

    socket.on('join_room', ({ name, roomId }: { name: string, roomId: string }) => {
        socket.join(roomId);
        tabooService.joinRoom(roomId, name, socket.id);
        emitRoomUpdate(io, roomId);
    });

    socket.on('switch_team', ({ roomId, team, playerId }: { roomId: string, team: string, playerId: string }) => {
        const room = tabooService.switchTeam(roomId, playerId, team, socket.id);
        if (room) emitRoomUpdate(io, roomId);
    });

    socket.on('update_settings', ({ roomId, settings }: { roomId: string, settings: any }) => {
        const room = tabooService.updateSettings(roomId, settings, socket.id);
        if (room) emitRoomUpdate(io, roomId);
    });

    socket.on('randomize_teams', (roomId: string) => {
        const room = tabooService.randomizeTeams(roomId, socket.id);
        if (room) emitRoomUpdate(io, roomId);
    });

    socket.on('start_game', (roomId: string) => {
        const room = tabooService.startGame(roomId, socket.id);
        if (room) emitRoomUpdate(io, roomId);
    });

    socket.on('game_action', ({ roomId, action }: { roomId: string, action: string }) => {
        const updated = tabooService.handleGameAction(roomId, action, socket.id, (scores: any) => {
            // Game End Callback
            io.to(roomId).emit('game_end', { scores });
        });

        if (updated) {
            // Next card logic handles card update
            emitGameStateUpdate(io, roomId);
        }
    });

    socket.on('start_turn_timer', ({ roomId }: { roomId: string }) => {
        tabooService.startTurnTimer(
            roomId,
            socket.id,
            (rid: string, timer: number) => {
                io.to(rid).emit('timer_update', timer);
            },
            (scores: any) => {
                // On Switch Teams / End Game
                if (scores) {
                    io.to(roomId).emit('game_end', { scores });
                } else {
                    emitRoomUpdate(io, roomId);
                }
            }
        );
        emitRoomUpdate(io, roomId);
    });

    socket.on('submit_guess', ({ roomId, guess }: { roomId: string, guess: string }) => {
        const result = tabooService.submitGuess(roomId, guess, socket.id);
        if (result) {
            io.to(roomId).emit('guess_result', { correct: result.correct, guess, team: result.team });
            if (result.correct) {
                emitGameStateUpdate(io, roomId);
            }
        }
    });
};
