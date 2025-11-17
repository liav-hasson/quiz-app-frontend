import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AnimatedBackground from './components/AnimatedBackground'
import Login from './pages/Login'
import Quiz from './pages/Quiz'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      {/* AnimatedBackground is always visible */}
      <AnimatedBackground />
      
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
