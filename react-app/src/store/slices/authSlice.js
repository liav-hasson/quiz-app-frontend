import { createSlice } from '@reduxjs/toolkit'

/**
 * Auth Slice - Manages user authentication state
 * Replaces the old AuthContext with Redux for better scalability
 */

const loadUserFromStorage = () => {
  try {
    // Check localStorage first, then sessionStorage (for "don't remember me" sessions)
    const stored = localStorage.getItem('quiz_user') || sessionStorage.getItem('quiz_user')
    if (!stored) return null
    
    const user = JSON.parse(stored)
    
    // Validate that user has required fields
    if (!user || (!user.email && !user.username)) {
      localStorage.removeItem('quiz_user')
      sessionStorage.removeItem('quiz_user')
      return null
    }
    
    return user
  } catch (error) {
    localStorage.removeItem('quiz_user')
    sessionStorage.removeItem('quiz_user')
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
    // Actions (like 'loginSuccess') describe WHAT happened.
    // Reducers describe HOW the state changes in response.
    loginSuccess: (state, action) => {
      if (import.meta.env.DEV) console.log('🔐 Redux loginSuccess called with:', action.payload)
      
      // Update the state with the new user data
      state.user = action.payload
      state.isAuthenticated = true
      
      // Persist to localStorage so they stay logged in on refresh
      localStorage.setItem('quiz_user', JSON.stringify(action.payload))
      if (import.meta.env.DEV) console.log('💾 User saved to localStorage and state updated')
    },
    logout: (state) => {
      if (import.meta.env.DEV) console.log('🚪 Redux logout called')
      
      // Clear the state
      state.user = null
      state.isAuthenticated = false
      
      // Clear all storage
      localStorage.removeItem('quiz_user')
      sessionStorage.removeItem('quiz_user')
      // Clear lobby state on logout
      localStorage.removeItem('lobby_state')
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions

// Selectors - Easy access to auth state
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthType = (state) => state.auth.user?.auth_type || 'google'

export default authSlice.reducer
