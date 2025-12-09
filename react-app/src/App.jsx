import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from './store/slices/authSlice'
import MainLayout from './layouts/MainLayout'
import HomeView from './views/HomeView'
import LoginView from './views/LoginView'
import GameView from './views/GameView'
import StatsView from './views/StatsView'
import LobbyView from './views/LobbyView'
import BattleGameView from './views/BattleGameView'

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  console.log('🛡️ ProtectedRoute check:', { isAuthenticated })
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to /login')
    return <Navigate to="/login" replace />
  }
  console.log('✅ Authenticated, rendering protected content')
  return <MainLayout>{children}</MainLayout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeView />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/play"
        element={
          <ProtectedRoute>
            <GameView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <StatsView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lobby/:lobbyId"
        element={
          <ProtectedRoute>
            <LobbyView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/battle/:lobbyId"
        element={
          <ProtectedRoute>
            <BattleGameView />
          </ProtectedRoute>
        }
      />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
