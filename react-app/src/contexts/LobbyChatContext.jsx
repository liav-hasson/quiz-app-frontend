import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import socketService from '../api/socketService'

const LobbyChatContext = createContext(null)

export const useLobbyChatContext = () => {
  const context = useContext(LobbyChatContext)
  return context
}

export const LobbyChatProvider = ({ children }) => {
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [lobbyId, setLobbyId] = useState(null)
  
  // Track previous lobby ID to detect lobby changes
  const previousLobbyIdRef = useRef(null)
  
  // Custom setLobbyId that only clears chat when entering a NEW lobby
  const setLobbyIdWithReset = useCallback((newLobbyId) => {
    if (newLobbyId && newLobbyId !== previousLobbyIdRef.current) {
      // Entering a new lobby - clear previous chat
      setChatMessages([])
      previousLobbyIdRef.current = newLobbyId
    }
    setLobbyId(newLobbyId)
  }, [])

  const handleSendMessage = useCallback((e) => {
    e.preventDefault()
    if (!chatInput?.trim() || !lobbyId) return
    
    socketService.sendMessage(lobbyId, chatInput.trim())
    setChatInput('')
  }, [chatInput, lobbyId])

  const value = {
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    lobbyId,
    setLobbyId: setLobbyIdWithReset,  // Use the wrapper function
    handleSendMessage
  }

  return (
    <LobbyChatContext.Provider value={value}>
      {children}
    </LobbyChatContext.Provider>
  )
}
