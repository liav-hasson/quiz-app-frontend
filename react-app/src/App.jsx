import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect, Suspense, lazy } from 'react'
import { Toaster } from 'react-hot-toast'
import { selectIsAuthenticated } from './store/slices/authSlice'
import { selectIsDark } from './store/slices/themeSlice'
import AnimatedBackground from './components/AnimatedBackground'
// Lazy-loaded pages to enable route-based code-splitting
const Login = lazy(() => import('./pages/Login'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Profile = lazy(() => import('./pages/Profile'))

// Protected route component
function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const isDark = useSelector(selectIsDark)

  // Sync .light class on <html> with Redux state (dark is default)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
    }
  }, [isDark])

  return (
    <>
      {/* AnimatedBackground is always visible */}
      <AnimatedBackground />
      
      {/* Toaster for notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--accent-quinary-light)',
          },
          duration: 4000,
        }}
      />
      
      {/* Routes are rendered on top of the background */}
      <div className="relative z-10">
        <Suspense fallback={(
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>
        )}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/quiz" replace />} />
            <Route path="*" element={<Navigate to="/quiz" replace />} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}