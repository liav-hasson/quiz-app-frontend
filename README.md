# Quiz App - Frontend Repository

A modern, responsive React frontend for the DevOps learning platform. Built with Vite, Tailwind CSS, Framer Motion, and Radix UI.
New version v2.0.0 stable is live!

---
## Related Repositories

- Backend: https://github.com/liav-hasson/quiz-app-backend.git
- GitOps: https://github.com/liav-hasson/quiz-app-gitops.git
- IaC: https://github.com/liav-hasson/quiz-app-iac.git
- Mini: https://github.com/liav-hasson/quiz-app-mini.git

---

## How to run
For local usage, follow the instructions in the separate mini-version repository: https://github.com/liav-hasson/quiz-app-mini (see `mini-version/bootstrap/README.md`). That repo starts frontend, backend, and multiplayer together via Docker Compose.

---

## Project Structure (brief)
- `src/` — components, pages, store, styles
- `public/` — static assets
- `vite.config.js` — Vite config
- `nginx.conf` — production nginx config

---

## Design System

### Single Source of Truth: `src/index.css`

All colors, styles, and animations are defined in one file for consistency and maintenance.

Edit the palette once; changes propagate across the app.

## Key Features

### Authentication
- Google OAuth 2.0 integration using Redux (`authSlice.js`)
- User session persistence (state persisted to `localStorage` by the app)
- Protected routes (quiz, profile, leaderboard only accessible when logged in)

### Quiz Interface
- Dynamic category/subject selection with dropdown menus
- Difficulty levels (Easy, Medium, Hard)
- Real-time question generation via backend API
- AI-powered answer evaluation with detailed feedback
- Answer submission with score and feedback

### User Profile
- Personal stats dashboard (XP, best category, average score)
- Answer history with expandable cards (last 20 answers)
- Performance chart showing trends over time (top 5 categories)
- Last activity tracking

### Leaderboard
- Global top 10 users ranked by XP
- User's current rank display
- Real-time rankings

### UI/UX
- Framer Motion for animations and transitions
- Animated background component
- Glass cards with backdrop blur
- Dark theme with neon accents
- Loading states and error handling

---

## Dependencies

| Package | Purpose |
|---------|---------|
| React | UI library |
| Redux Toolkit | State management |
| React Router | Client-side routing |
| Framer Motion | Animations & transitions |
| Tailwind CSS | Utility-first styling |
| Radix UI | Accessible UI components |
| React Hot Toast | Notifications |
| Recharts | Performance charts |
| Vite | Build tool & dev server |

---

## API Integration

The frontend communicates with the backend via RESTful API using JWT authentication.

### Core API Endpoints

> **Full API documentation**: See `FRONTEND_DEV_GUIDE.md` and project root `README.md` for complete endpoint specifications.

**Authentication:**
- `POST /api/auth/google-login` - Google OAuth verification & JWT issuance

**Quiz:**
- `GET /api/all-subjects` - Get all categories with subjects (cached 30m)
- `POST /api/question/generate` - Generate AI question
- `POST /api/answer/evaluate` - Evaluate answer with AI feedback
- `POST /api/user/answers` - Save answer to history

**Profile (Optimized - 3 Strategic Calls):**
- `GET /api/user/profile` - User stats + level system (XP, level, levelProgress, bestCategory, averageScore, streak, totalAnswers, lastActivity)
- `GET /api/user/history` - Answer history with summary + details structure (paginated via `before` param)
- `GET /api/user/performance` - Time-bucketed performance data (period: 7d/30d/90d/all, granularity: day/week/month)

**Leaderboard:**
- `GET /api/user/leaderboard/enhanced` - Top 10 users + current user rank

### API Client
All API calls are centralized in `react-app/src/api/quizAPI.js` with:
- Automatic JWT token injection
- Error handling and timeout management
- Response normalization
- Auth failure detection (auto-logout on 401)