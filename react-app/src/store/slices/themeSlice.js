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
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
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
      
      // Apply theme to HTML element
      if (state.isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    setTheme: (state, action) => {
      state.isDark = action.payload
      localStorage.setItem('quiz_theme_dark', String(state.isDark))
      
      if (state.isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
  },
})

export const { toggleTheme, setTheme } = themeSlice.actions

// Selectors
export const selectIsDark = (state) => state.theme.isDark

export default themeSlice.reducer
