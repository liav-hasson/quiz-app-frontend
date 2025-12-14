# API Client

Centralized API helpers used by the frontend.

## Files
- `quizAPI.js` — REST client for auth, quiz generation, history, profile, leaderboard
- `socketService.js` — Socket.IO client for multiplayer

## Environment
- `VITE_API_BASE_URL` — HTTP base for REST calls (e.g., http://localhost:5000)
- `VITE_MULTIPLAYER_URL` — WebSocket base for multiplayer (e.g., http://localhost:5001)

## Notes
- JWT is read from `localStorage` (`quiz_user`) and attached as `Authorization: Bearer ...`.
- `quizAPI.js` handles auth failures (401) by clearing the session and redirecting to `/login`.
