# Quiz App - Frontend Repository

A modern, responsive React frontend for the DevOps learning platform. Built with Vite, Tailwind CSS, Framer Motion, and Radix UI.

---
## Related Repositories

- Backend: https://github.com/liav-hasson/quiz-app-backend.git
- GitOps: https://github.com/liav-hasson/quiz-app-gitops.git
- IaC: https://github.com/liav-hasson/quiz-app-iac.git
- Mini: https://github.com/liav-hasson/quiz-app-mini.git

---

## Quick Start

```bash
cd react-app
npm install
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Project Structure

```
react-app/
├── src/
│   ├── index.css              ← Single source of truth (colors + all CSS)
│   ├── main.jsx               ← App entry point
│   ├── App.jsx                ← Main router & layout
│   ├── components/
│   │   ├── Header.jsx         ← Navigation & user info
│   │   ├── AnimatedBackground.jsx
│   │   ├── AnimatedBorder.jsx
│   │   ├── profile/           ← Profile page components
│   │   │   ├── HistoryCard.jsx
│   │   │   └── PerformanceChart.jsx
│   │   └── ui/                ← Radix UI primitives (button, card, input, etc.)
│   ├── pages/
│   │   ├── Login.jsx          ← Google OAuth login
│   │   ├── Quiz.jsx           ← Main quiz interface
│   │   ├── Profile.jsx        ← User profile & stats
│   │   └── Leaderboard.jsx    ← Global leaderboard
│   ├── store/
│   │   ├── index.js           ← Redux store configuration
│   │   └── slices/            ← Redux Toolkit slices (auth, quiz, theme)
│   └── lib/
│       ├── colors.js          ← Deprecated (reference only)
│       ├── toastConfig.js     ← Toast notifications setup
│       └── utils.js           ← Helper functions
├── public/                    ← Static assets (logo, favicon)
├── index.html
├── vite.config.js
├── tailwind.config.js         ← Tailwind CSS config
├── postcss.config.js
├── nginx.conf                 ← Production Nginx config
└── package.json
```

---

## Design System

### Single Source of Truth: `src/index.css`

All colors, styles, and animations are defined in one file for consistency and maintenance.

Edit the palette once; changes propagate across the app.

```css
@theme {
  /* Palette - primary hex colors */
  --color-neon-pink: #f72585;
  --color-turquoise-bright: #1ee3cf;
  --color-soft-cyan: #92f2e8;
  /* ... */
  
  /* Semantic variables - for usage context */
  --accent-primary: #3a0ca3;
  --accent-secondary: #92f2e8;
  --accent-tertiary: #7209b7;
  --accent-quaternary: #f72585;
}
```

Available color variants:
- Light, Medium, Strong opacity versions of each accent color
- Gradients: `var(--gradient-primary)`, `var(--gradient-neon-purple)`, etc.
- Background colors: `--bg-dark`, `--bg-card` with opacity variants

Usage in JSX:

```jsx
// Tailwind classes automatically reference the palette
<div className="bg-neon-pink text-soft-cyan border-turquoise-bright/30">

// CSS variables in styled components
<motion.div style={{ background: 'var(--gradient-primary)' }}>
```

---

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
- Glass-morphism cards with backdrop blur
- Dark theme with neon accents
- Responsive design (mobile-first)
- Toast notifications for user feedback
- Loading states and error handling

### Accessibility
- Radix UI components (semantic, accessible)
- Keyboard navigation support
- Theme toggle (dark/light mode)

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

## Build & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Docker Deployment
The `nginx.conf` is configured for production to serve the SPA, handle routing, and enable gzip compression. See the Dockerfile in `ci/app-dockerfile` for the multi-stage build.

---

## API Integration

The frontend communicates with the backend via RESTful API using JWT authentication.

### Core API Endpoints

**Authentication:**
- `POST /api/auth/google-login` - Google OAuth verification & JWT issuance

**Quiz:**
- `GET /api/all-subjects` - Get all categories with subjects (cached)
- `POST /api/question/generate` - Generate AI question
- `POST /api/answer/evaluate` - Evaluate answer with AI feedback
- `POST /api/user/answers` - Save answer to history

**Profile (Optimized - 3 Strategic Calls):**
- `GET /api/user/profile` - User stats (XP, bestCategory, averageScore, totalAnswers, lastActivity)
- `GET /api/user/history` - Last 20 full answers with details (paginated)
- `GET /api/user/performance` - Aggregated chart data (top 5 categories, time-based)

**Leaderboard:**
- `GET /api/user/leaderboard/enhanced` - Top 10 users + current user rank

### API Client
All API calls are centralized in `react-app/src/api/quizAPI.js` with:
- Automatic JWT token injection
- Error handling and timeout management
- Response normalization
- Auth failure detection (auto-logout on 401)

### Backend Requirements
See `API_REQUIREMENTS.md` for detailed specifications of each endpoint including request/response formats, business logic, and implementation guidelines.

---

## Environment Variables

Create a `.env` file in `react-app/`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_API_BASE_URL=http://localhost:5000  # Backend API URL (optional)
```
