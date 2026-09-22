# Skill: Socket Features (Online Multiplayer)

Use when adding or modifying online multiplayer for any game.

## Architecture

- **Server**: `server/src/` (TypeScript). Layered: `handlers/` (socket wiring) → `services/`
  (authoritative game state, e.g. `TabooService.ts`) → `models/types.ts` (shared types) →
  `data/` (e.g. `forbiddenWords.ts` card deck). `index.ts` boots Express + Socket.IO, CORS `*`,
  `PORT = process.env.PORT || 3001`, and registers handlers per game on every connection:
  `setupTabooHandlers(io, socket)` etc.
- **Client**: game `Online.js` components connect with `io(process.env.REACT_APP_SERVER_URL)`
  (`socket.io-client`), join rooms, and render from emitted state. The client is *not*
  authoritative — it renders server truth.

## Event contract (never break it)

Events are lower_snake_case. Server emits **full room snapshots** on every change via a per-game
`emitRoomUpdate` helper — clients never patch state locally.

Taboo (reference contract, `tabooHandler.ts` ↔ `ForbiddenWords/Online.js`):
- Client → server: `create_room { name }`, `join_room { name, roomId }`,
  `switch_team { roomId, team, playerId }`, plus turn events (start/skip/guess/next) with the
  same `{ roomId, ... }` envelope.
- Server → room: `room_created` (roomId ack to creator), `room_update` (players, gameState,
  turnStatus, scores, currentTeam, giverId, timer, hostId, settings, turnScore, currentRound,
  totalRounds), `game_state_update` (currentCard, scores, gameState, giverId, currentTeam,
  turnScore, currentRound, totalRounds, settings).

When adding a feature (chat, rematch, spectate):
1. Extend the snapshot payload in `emitRoomUpdate`/`emitGameStateUpdate` rather than adding
   parallel one-off events — existing clients stay compatible.
2. Mutate state only through the service; the handler validates `socket.id` belongs to the room
   (see `switchTeam(roomId, playerId, team, socket.id)`).
3. Emit to the room (`io.to(roomId)`), not to individual sockets, after each mutation.
4. Add the matching server type in `models/types.ts`.
5. Client: register listeners inside the same `useEffect` that creates the socket; clean up with
   `socket.disconnect()` on unmount; keep player name in `localStorage` (pattern:
   `taboo_player_name`).
6. Deep-link join via query param (`?room=<id>`) + auto-join on `connect` is the established UX.

## Rules

- Never rename an existing event or remove fields from snapshots — deployed clients may be older.
- New games copy the taboo file trio (handler + service + client Online.js) and register the
  handler in `server/src/index.ts`.
- `connectionStatus` handling: show "connecting → connected → server sleeping/retrying" states
  instead of hard-failing on `connect_error` (serverless cold starts).
- Frontend is plain JS; server is TS — mirror the TS types in your client code comments/shape.

## Verification

`yarn build` for the client; run `cd server && npm install && npx ts-node src/index.ts` (or the
repo's start script) and test two browser tabs end-to-end before considering a multiplayer
change done.
