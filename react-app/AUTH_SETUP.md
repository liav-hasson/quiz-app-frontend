# Quiz App with Google Sign-In

This React app now includes Google Sign-In authentication and uses React Router for navigation.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID (Web application)
   - Add `http://localhost:5173` to Authorized JavaScript origins
   - Copy your Client ID

3. **Set environment variable:**
   Create a `.env` file in the `react-app` directory:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

4. **Run the app:**
   ```bash
   npm run dev
   ```

## Features

### Authentication
- **Google Sign-In**: Users must sign in with Google to access the quiz
- **Session Persistence**: User data is stored in `localStorage` under the key `quiz_user`
- **Protected Routes**: Quiz page is only accessible when authenticated
- **Logout**: Users can sign out via the header button

### Routing
- `/login` - Google Sign-In page
- `/quiz` - Main quiz interface (protected)
- `/` - Redirects to `/quiz`

### UI
- **AnimatedBackground**: Always visible across all pages
- **Header**: Shows user info and logout button when authenticated
- **Responsive**: Works on mobile and desktop

## Architecture

```
src/
├── context/
│   └── AuthContext.jsx        # Authentication state management
├── pages/
│   ├── Login.jsx              # Google Sign-In page
│   └── Quiz.jsx               # Main quiz interface
├── components/
│   ├── Header.jsx             # App header with user info
│   ├── AnimatedBackground.jsx # Background animation
│   └── ui/                    # shadcn/ui components
├── App.jsx                    # Router configuration
└── main.jsx                   # App entry with providers
```

## User Flow

1. User visits app → redirected to `/login`
2. User clicks "Sign in with Google"
3. Google authentication completes
4. User data stored in localStorage
5. User redirected to `/quiz`
6. User can take quizzes
7. User clicks "Logout" → back to `/login`

## Notes

- The animated background remains visible on all pages
- User authentication is client-side only (for production, verify tokens server-side)
- The Google ID token is stored but not currently sent to the backend API
