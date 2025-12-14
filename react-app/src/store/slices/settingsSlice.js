import { createSlice } from '@reduxjs/toolkit'

/**
 * Settings Slice - Manages user AI configuration settings
 * Stores custom OpenAI API key and model selection with localStorage persistence
 */

const STORAGE_KEY = 'quiz_ai_settings'
const DEFAULT_MODEL = 'gpt-4o-mini'

const loadSettingsFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        customApiKey: parsed.customApiKey || '',
        selectedModel: parsed.selectedModel || DEFAULT_MODEL,
      }
    }
  } catch {
    // Fall through to defaults on error
  }
  return {
    customApiKey: '',
    selectedModel: DEFAULT_MODEL,
  }
}

const saveSettingsToStorage = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState: loadSettingsFromStorage(),
  reducers: {
    setCustomApiKey: (state, action) => {
      state.customApiKey = action.payload
      saveSettingsToStorage(state)
    },
    setSelectedModel: (state, action) => {
      state.selectedModel = action.payload
      saveSettingsToStorage(state)
    },
    clearCustomApiKey: (state) => {
      state.customApiKey = ''
      saveSettingsToStorage(state)
    },
    /**
     * Reload settings from localStorage - call this after login or localStorage changes
     */
    reloadSettings: (state) => {
      const loaded = loadSettingsFromStorage()
      state.customApiKey = loaded.customApiKey
      state.selectedModel = loaded.selectedModel
    },
    resetSettings: (state) => {
      state.customApiKey = ''
      state.selectedModel = DEFAULT_MODEL
      saveSettingsToStorage(state)
    },
  },
})

export const { 
  setCustomApiKey, 
  setSelectedModel, 
  clearCustomApiKey, 
  resetSettings,
  reloadSettings
} = settingsSlice.actions

// Selectors
export const selectCustomApiKey = (state) => state.settings.customApiKey
export const selectSelectedModel = (state) => state.settings.selectedModel
export const selectHasCustomApiKey = (state) => Boolean(state.settings.customApiKey)

export default settingsSlice.reducer
