const { tabooCards } = require('./data');

// Store room state
// roomID -> { 
//   players: [{id, name, score}], 
//   gameState: 'waiting' | 'playing' | 'end',
//   currentCard: null,
//   giverIndex: 0,
//   timer: 60,
//   score: 0,
//   usedCards: [],
//   timerInterval: null
// }
const rooms = {};

const setupTabooHandlers = (io, socket) => {

    socket.on('join_room', ({ name, roomId }) => {
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: [],
                gameState: 'waiting',
                currentCard: null,
                giverIndex: 0,
                timer: 60,
                score: 0,
                usedCards: [],
                timerInterval: null
            };
        }

        // Add player if not already in (simple check)
        const existingPlayer = rooms[roomId].players.find(p => p.id === socket.id);
        if (!existingPlayer) {
            rooms[roomId].players.push({
                id: socket.id,
                name: name || `Player ${rooms[roomId].players.length + 1}`,
                score: 0
            });
        }

        io.to(roomId).emit('room_update', {
            players: rooms[roomId].players,
            gameState: rooms[roomId].gameState,
            giverId: rooms[roomId].players[rooms[roomId].giverIndex]?.id
        });
    });

    socket.on('start_game', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;

        room.gameState = 'playing';
        room.score = 0;
        room.timer = 60;
        room.giverIndex = 0;
        room.usedCards = [];

        startRound(io, roomId);
    });

    socket.on('game_action', ({ roomId, action }) => {
        // action: 'correct', 'skip', 'taboo'
        const room = rooms[roomId];
        if (!room || room.gameState !== 'playing') return;

        if (action === 'correct') {
            room.score += 1;
        } else if (action === 'taboo') {
            room.score = Math.max(0, room.score - 1);
        }
        // 'skip' does nothing to score

        nextCard(io, roomId);
    });
};

function startRound(io, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    // Pick random card
    nextCard(io, roomId);

    // Start timer
    if (room.timerInterval) clearInterval(room.timerInterval);

    room.timer = 60;
    room.timerInterval = setInterval(() => {
        room.timer -= 1;
        io.to(roomId).emit('timer_update', room.timer);

        if (room.timer <= 0) {
            clearInterval(room.timerInterval);
            room.gameState = 'end';
            io.to(roomId).emit('game_end', { score: room.score });
        }
    }, 1000);
}

function nextCard(io, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    // Filter out used cards
    const availableCards = tabooCards.filter(c => !room.usedCards.includes(c.word));

    if (availableCards.length === 0) {
        // Reshuffle / Clear used if we run out? Or just end?
        // Let's just clear used for endless play or end game
        room.gameState = 'end';
        if (room.timerInterval) clearInterval(room.timerInterval);
        io.to(roomId).emit('game_end', { score: room.score, message: "Out of cards!" });
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards[randomIndex];

    room.currentCard = card;
    room.usedCards.push(card.word);

    io.to(roomId).emit('game_state_update', {
        currentCard: room.currentCard,
        score: room.score,
        gameState: room.gameState,
        giverId: room.players[room.giverIndex].id
    });
}

module.exports = { setupTabooHandlers };
