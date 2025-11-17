# Quiz App - Frontend Repository

A modern, responsive React frontend for the DevOps learning platform. Built with **Vite**, **Tailwind CSS**, **Framer Motion**, and **Radix UI**.

---

## 🚀 Related Repositories

- **[Backend](https://github.com/liav-hasson/quiz-app-backend.git)** - Flask API
- **[GitOps](https://github.com/liav-hasson/quiz-app-gitops.git)** - ArgoCD deployment
- **[IaC](https://github.com/liav-hasson/quiz-app-iac.git)** - Terraform infrastructure
- **[Mini](https://github.com/liav-hasson/quiz-app-mini.git)** - Self-hosted version

---

## 🚀 Quick Start

```bash
cd react-app
npm install
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

---

## 📋 Project Structure

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
│   ├── context/
│   │   ├── AuthContext.jsx    ← User authentication state
│   │   └── ThemeContext.jsx   ← Dark/light mode toggle
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

## 🎨 Design System

### Single Source of Truth: `src/index.css`

All colors, styles, and animations are defined **in one file** for consistency and easy maintenance.

**Edit the palette once, everything updates automatically:**

```css
@theme {
  /* Palette - primary hex colors */
  --color-neon-pink: #f72585;
  --color-turquoise-bright: #1ee3cf;
  --color-soft-cyan: #92f2e8;
  /* ... */
  
  /* Semantic variables - for usage context */
  --accent-primary: #3a0ca3;        /* Vivid Royal - logo color */
  --accent-secondary: #92f2e8;      /* Soft Cyan - text & accents */
  --accent-tertiary: #7209b7;       /* Indigo Bloom - supporting */
  --accent-quaternary: #f72585;     /* Neon Pink - highlights */
  /* ... plus 3 more for depth */
}
```

**Available color variants:**
- Light, Medium, Strong opacity versions of each accent color
- Gradients: `var(--gradient-primary)`, `var(--gradient-neon-purple)`, etc.
- Background colors: `--bg-dark`, `--bg-card` with opacity variants

**Usage in JSX:**
```jsx
// Tailwind classes automatically reference the palette
<div className="bg-neon-pink text-soft-cyan border-turquoise-bright/30">
  
// CSS variables in styled components
<motion.div style={{ background: 'var(--gradient-primary)' }}>
```

---

## 🔑 Key Features

### Authentication
- **Google OAuth 2.0** integration via `AuthContext.jsx`
- User session persistence
- Protected routes (quiz only accessible when logged in)

### Quiz Interface
- **Dynamic category/subject selection** with dropdown menus
- **Difficulty levels** (Easy, Medium, Hard)
- **Real-time question generation** via backend API
- **Answer submission** with feedback scoring

### UI/UX
- **Framer Motion animations** for smooth transitions
- **Animated background** with floating gradient orbs
- **Glass-morphism cards** with backdrop blur effects
- **Dark theme with neon accents** for visual appeal
- **Responsive design** (mobile, tablet, desktop)
- **Toast notifications** for user feedback

### Accessibility
- Radix UI components (semantic, WCAG compliant)
- Keyboard navigation support
- Theme toggle (dark/light mode)

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| **React** | UI library |
| **React Router** | Client-side routing |
| **Framer Motion** | Animations & transitions |
| **Tailwind CSS** | Utility-first styling |
| **Radix UI** | Accessible UI components |
| **React Hot Toast** | Toast notifications |
| **Vite** | Build tool & dev server |

---

## 🔄 Build & Deployment

### Development
```bash
npm run dev
```
Starts Vite dev server with HMR (Hot Module Replacement).

### Production Build
```bash
npm run build
```
Generates optimized static files in `dist/` folder.

### Docker Deployment
The `nginx.conf` is configured for production:
- Serves the React SPA from `dist/`
- Handles routing (404s redirect to `index.html`)
- Gzip compression enabled
- Can be deployed via Docker (see `ci/app-dockerfile/Dockerfile`)

---

## 🎯 API Integration

The frontend communicates with the **Flask backend** via HTTP requests:

```javascript
// Example: Generate a question
fetch('/api/question/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ category, subject, difficulty })
})
```

**Required backend endpoints:**
- `GET /api/categories` — Fetch available categories
- `GET /api/subjects?category=X` — Fetch subjects for a category
- `POST /api/question/generate` — Generate a quiz question

---

## 🌐 Environment Variables

Create a `.env` file in `react-app/`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_API_BASE_URL=http://localhost:5000  # Backend API URL (optional)
```
