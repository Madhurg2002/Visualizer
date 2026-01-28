export interface Player {
    id: string;
    name: string;
    color?: 'w' | 'b'; // Chess specific
    team?: string;     // Taboo specific
    symbol?: 'X' | 'O'; // TicTacToe specific
    score?: number;
    timesGiver?: number; // Taboo specific
}

export interface RoomSettings {
    roundTime: number;
    totalRounds: number;
    inputMode: string;
}

export interface GameState {
    roomId: string; // Add roomId to state
    players: Player[];
    gameState: 'waiting' | 'playing' | 'end' | 'timeout'; // added timeout for chess
    hostId?: string;
}

export interface ChessRoom extends GameState {
    board: any; // Chess.js board state or string
    turn: 'w' | 'b';
    spectators: Player[];
    timeControl: number;
    whiteTime: number;
    blackTime: number;
}

export interface TabooRoom extends GameState {
    currentCard: any;
    timer: number;
    usedCards: string[];
    timerInterval: any;
    scores: { [team: string]: number };
    currentTeam: string;
    giverId: string | null;
    settings: RoomSettings;
    turnsPlayed: number;
    turnScore: number;
    turnStatus?: 'waiting' | 'playing';
}

export interface TicTacToeRoom extends GameState {
    board: (string | null)[];
    currentTurn: 'X' | 'O';
    winner: string | null;
    winningLine: number[] | null;
}
