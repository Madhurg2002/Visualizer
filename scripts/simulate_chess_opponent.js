const io = require('socket.io-client');

const SERVER_URL = process.env.SERVER_URL;
const roomId = process.argv[2];

if (!roomId) {
    console.error("Usage: node simulate_chess_opponent.js <ROOM_ID>");
    process.exit(1);
}

console.log(`Connecting to ${SERVER_URL}...`);
const socket = io(SERVER_URL);

socket.on('connect', () => {
    console.log(`Connected with ID: ${socket.id}`);

    // Join Room
    console.log(`Joining room ${roomId}...`);
    socket.emit('chess_join_room', { roomId, playerName: 'SimulatedOpponent' });
});

socket.on('chess_player_joined', (data) => {
    console.log('[Event] chess_player_joined:', data);
    const me = data.players.find(p => p.id === socket.id);
    if (me && me.color === 'b') {
        console.log("I am Black. Waiting for move...");
        // Wait for White to move? Or if I am White? 
        // Wait, typical flow: Creator is White. Sim is Black.
        // Wait 5 seconds, check if whiteTime updates? 
        // Actually, let's just wait and see if we get 'chess_move_made' from host.
    }
});

socket.on('chess_move_made', (data) => {
    console.log('[Event] chess_move_made:', data);
    console.log(`Timers -> White: ${data.whiteTime}, Black: ${data.blackTime}`);

    // If it was White's move, I respond
    if (data.turn === 'b') {
        console.log("My turn! Making a move (e7-e5)...");

        // Mock Move Payload
        // Board state is complex to mock entire array.
        // BUT server handler just RELAYS whatever we send.
        // So I can send a dummy board state if I want, OR simpler:
        // Just send the move object and HOPE the client doesn't crash on invalid board?
        // NO, the client expects a board array.
        // I should probably just simulate the 'move' event payload structure minimally if possible,
        // or better: The host client handles logic. The sim is barely a client.
        // If Sim sends garbage board, Host UI breaks.

        // Fix: This script is just to VERIFY connection and Timer sync. 
        // I will rely on the Browser Subagent to see 'Player 2 Joined'.
        // Then I will rely on the Browser Subagent to see 'Time Control' applied.

        // Actually, if I want to Verify Timer Countdown, I need the game to START.
        // Game starts when P2 joins. 
        // So this script simply joining is ENOUGH to trigger the Timer on Host.

        console.log("Staying connected to keep timer running...");
    }
});

socket.on('chess_error', (err) => {
    console.error('Error:', err);
});

// Keep alive
setInterval(() => { }, 1000);
