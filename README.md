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
│   │   └── ui/                ← Radix UI primitives (button, card, input, etc.)
│   ├── pages/
│   │   ├── Login.jsx          ← Google OAuth login
│   │   └── Quiz.jsx           ← Main quiz interface
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
- Protected routes (quiz only accessible when logged in)

### Quiz Interface
- Dynamic category/subject selection with dropdown menus
- Difficulty levels (Easy, Medium, Hard)
- Real-time question generation via backend API
- Answer submission with feedback

### UI/UX
- Framer Motion for animations and transitions
- Animated background component
- Glass-morphism cards with backdrop blur
- Dark theme with neon accents
- Responsive design
- Toast notifications for user feedback

### Accessibility
- Radix UI components (semantic, accessible)
- Keyboard navigation support
- Theme toggle (dark/light mode)

---

## Dependencies

| Package | Purpose |
|---------|---------|
| React | UI library |
| React Router | Client-side routing |
| Framer Motion | Animations & transitions |
| Tailwind CSS | Utility-first styling |
| Radix UI | Accessible UI components |
| React Hot Toast | Notifications |
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

The frontend communicates with the Flask backend via HTTP requests.

Required backend endpoints:
- `GET /api/categories`
- `GET /api/subjects?category=X`
- `POST /api/question/generate`

The frontend API wrapper is implemented in `react-app/src/api/quizAPI.js`.

---

## Environment Variables

Create a `.env` file in `react-app/`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_API_BASE_URL=http://localhost:5000  # Backend API URL (optional)
```
