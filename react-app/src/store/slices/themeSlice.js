import { createSlice } from '@reduxjs/toolkit'

/**
 * Theme Slice - Manages dark/light theme state
 * Replaces the old ThemeContext with Redux
 */

const loadThemeFromStorage = () => {
  try {
    const stored = localStorage.getItem('quiz_theme_dark')
    if (stored !== null) {
      return stored === 'true'
    }
    return true // Default to dark mode
  } catch {
    return true // Default to dark mode on error
  }
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    isDark: loadThemeFromStorage(),
  },
  reducers: {
    toggleTheme: (state) => {
      state.isDark = !state.isDark
      localStorage.setItem('quiz_theme_dark', String(state.isDark))
      // DOM manipulation removed - handled by useEffect in App.jsx
    },
    setTheme: (state, action) => {
      state.isDark = action.payload
      localStorage.setItem('quiz_theme_dark', String(state.isDark))
      // DOM manipulation removed - handled by useEffect in App.jsx
    },
  },
})

export const { toggleTheme, setTheme } = themeSlice.actions

// Selectors
export const selectIsDark = (state) => state.theme.isDark

export default themeSlice.reducer
