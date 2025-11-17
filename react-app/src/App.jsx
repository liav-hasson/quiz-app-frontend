import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import AnimatedBackground from './components/AnimatedBackground'
import Login from './pages/Login'
import Quiz from './pages/Quiz'
import { toasterProps } from './lib/toastConfig'

// Protected route component
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <>
      {/* AnimatedBackground is always visible */}
      <AnimatedBackground />
      
      {/* Toaster for notifications */}
      <Toaster {...toasterProps} />
      
      {/* Routes are rendered on top of the background */}
      <div className="relative z-10">
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
          <Route path="/" element={<Navigate to="/quiz" replace />} />
          <Route path="*" element={<Navigate to="/quiz" replace />} />
        </Routes>
      </div>
    </>
  )
}