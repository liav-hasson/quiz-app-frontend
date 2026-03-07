import { createSlice } from '@reduxjs/toolkit'

/**
 * Lobby Slice - Manages persistent multiplayer lobby state
 * Ensures users stay in lobbies when navigating between pages
 */

const lobbySlice = createSlice({
  name: 'lobby',
  initialState: {
    // Current lobby membership
    currentLobbyCode: null, // The lobby code the user is currently in
    isInLobby: false, // Whether the user is actively in a lobby
    
    // Lobby data cache (optional, can help with reconnection)
    lobbyData: null, // Last known lobby state
    
    // Join timestamp to help with reconnection logic
    joinedAt: null,

    // Whether a multiplayer game is currently in progress
    gameInProgress: false,
  },
  reducers: {
    // Join a lobby
    joinLobby: (state, action) => {
      state.currentLobbyCode = action.payload.lobbyCode
      state.isInLobby = true
      state.joinedAt = Date.now()
      if (action.payload.lobbyData) {
        state.lobbyData = action.payload.lobbyData
      }
    },
    
    // Leave a lobby (explicit user action)
    leaveLobby: (state) => {
      state.currentLobbyCode = null
      state.isInLobby = false
      state.lobbyData = null
      state.joinedAt = null
      state.gameInProgress = false
    },
    
    // Update cached lobby data
    updateLobbyData: (state, action) => {
      if (state.isInLobby && action.payload.lobbyCode === state.currentLobbyCode) {
        state.lobbyData = action.payload.lobbyData
      }
    },
    
    // Clear lobby state (on logout or error)
    clearLobbyState: (state) => {
      state.currentLobbyCode = null
      state.isInLobby = false
      state.lobbyData = null
      state.joinedAt = null
      state.gameInProgress = false
    },

    // Set game in progress flag
    setGameInProgress: (state, action) => {
      state.gameInProgress = action.payload
    },
  },
})

export const {
  joinLobby,
  leaveLobby,
  updateLobbyData,
  clearLobbyState,
  setGameInProgress,
} = lobbySlice.actions

// Selectors
export const selectCurrentLobbyCode = (state) => state.lobby?.currentLobbyCode
export const selectIsInLobby = (state) => state.lobby?.isInLobby || false
export const selectLobbyData = (state) => state.lobby?.lobbyData
export const selectLobbyJoinedAt = (state) => state.lobby?.joinedAt
export const selectGameInProgress = (state) => state.lobby?.gameInProgress || false

export default lobbySlice.reducer
