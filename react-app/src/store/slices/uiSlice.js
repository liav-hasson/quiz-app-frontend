import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isMobileMenuOpen: false,
    activeTab: 'home', // home, play, multiplayer, stats, settings
    animatedBackground: true, // Enable/disable psychedelic spiral background
    selectedHistoryItem: null,
  },
  reducers: {
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    setMobileMenuOpen: (state, action) => {
      state.isMobileMenuOpen = action.payload
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload
      // Clear selected history item when changing tabs
      if (action.payload !== 'history') {
        state.selectedHistoryItem = null
      }
    },
    setSelectedHistoryItem: (state, action) => {
      state.selectedHistoryItem = action.payload
    },
    toggleAnimatedBackground: (state) => {
      state.animatedBackground = !state.animatedBackground
    },
    setAnimatedBackground: (state, action) => {
      state.animatedBackground = action.payload
    },
  },
})

export const { toggleMobileMenu, setMobileMenuOpen, closeMobileMenu, setActiveTab, setSelectedHistoryItem, toggleAnimatedBackground, setAnimatedBackground } = uiSlice.actions

export const selectIsMobileMenuOpen = (state) => state.ui.isMobileMenuOpen
export const selectActiveTab = (state) => state.ui.activeTab
export const selectSelectedHistoryItem = (state) => state.ui.selectedHistoryItem
export const selectAnimatedBackground = (state) => state.ui.animatedBackground

export default uiSlice.reducer
