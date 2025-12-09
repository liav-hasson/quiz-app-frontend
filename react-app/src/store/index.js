import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import themeReducer from './slices/themeSlice'
import quizReducer from './slices/quizSlice'
import uiReducer from './slices/uiSlice'
import tasksReducer from './slices/tasksSlice'
import lobbyReducer from './slices/lobbySlice'
import settingsReducer from './slices/settingsSlice'

// Load lobby state from localStorage
const loadLobbyState = () => {
  try {
    const serializedState = localStorage.getItem('lobby_state')
    if (serializedState === null) {
      return undefined
    }
    return JSON.parse(serializedState)
  } catch (err) {
    console.error('Failed to load lobby state from localStorage:', err)
    return undefined
  }
}

// Save lobby state to localStorage
const saveLobbyState = (state) => {
  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem('lobby_state', serializedState)
  } catch (err) {
    console.error('Failed to save lobby state to localStorage:', err)
  }
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    quiz: quizReducer,
    ui: uiReducer,
    tasks: tasksReducer,
    lobby: lobbyReducer,
    settings: settingsReducer,
  },
  preloadedState: {
    lobby: loadLobbyState(),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

// Subscribe to store changes and persist lobby state
store.subscribe(() => {
  saveLobbyState(store.getState().lobby)
})

export default store
