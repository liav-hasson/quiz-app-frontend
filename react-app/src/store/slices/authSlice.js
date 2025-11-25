import { createSlice } from '@reduxjs/toolkit'

/**
 * Auth Slice - Manages user authentication state
 * Replaces the old AuthContext with Redux for better scalability
 */

const loadUserFromStorage = () => {
  try {
    const stored = localStorage.getItem('quiz_user')
    if (!stored) return null
    
    const user = JSON.parse(stored)
    
    // Validate that user has at least an email
    // Clear obvious mock data (dev@localhost without real auth)
    if (!user || !user.email) {
      localStorage.removeItem('quiz_user')
      return null
    }
    
    // Clear mock/dev users
    if (user.email === 'dev@localhost' || user.id === 'local-dev-user') {
      localStorage.removeItem('quiz_user')
      return null
    }
    
    return user
  } catch (error) {
    localStorage.removeItem('quiz_user')
    return null
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: loadUserFromStorage(),
    isAuthenticated: !!loadUserFromStorage(),
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('quiz_user', JSON.stringify(action.payload))
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('quiz_user')
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions

// Selectors - Easy access to auth state
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated

export default authSlice.reducer
