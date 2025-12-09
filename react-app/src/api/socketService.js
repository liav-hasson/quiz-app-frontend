/**
 * Socket.IO Service for Multiplayer
 * Handles WebSocket connection to the multiplayer server
 * 
 * Architecture:
 * - REST API calls go to API_BASE_URL (backend-api)
 * - Socket.IO connects to MULTIPLAYER_URL (backend-multiplayer)
 */

import { io } from 'socket.io-client'
import { USE_MOCK_API, MULTIPLAYER_URL } from '../config.js'

let socket = null
let connectionPromise = null

/**
 * Get JWT token from localStorage
 */
function getToken() {
  const userStr = localStorage.getItem('quiz_user')
  const user = userStr ? JSON.parse(userStr) : null
  return user?.token
}

/**
 * Initialize Socket.IO connection
 * @returns {Promise<Socket>} Connected socket instance
 */
export function initSocket() {
  if (USE_MOCK_API) {
    console.log('🎭 Mock mode - Socket.IO disabled')
    return Promise.resolve(createMockSocket())
  }

  // Return existing connection if available
  if (socket?.connected) {
    return Promise.resolve(socket)
  }

  // Return pending connection if in progress
  if (connectionPromise) {
    return connectionPromise
  }

  connectionPromise = new Promise((resolve, reject) => {
    const token = getToken()
    
    if (!token) {
      console.warn('⚠️ No auth token - Socket.IO connection may fail')
    }

    // Empty string = same origin (nginx proxies /socket.io/ to multiplayer backend)
    console.log('🔌 Connecting to WebSocket server:', MULTIPLAYER_URL || '(same origin)')

    socket = io(MULTIPLAYER_URL || undefined, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket.id)
      connectionPromise = null
      
      // Debug listener for answer_recorded - always logs when event is received
      socket.onAny((event, ...args) => {
        console.log(`[SOCKET EVENT] ${event}:`, args)
      })
      
      resolve(socket)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message)
      connectionPromise = null
      reject(error)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason)
    })

    socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error)
    })

    // Handle reconnection
    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts')
    })

    // Timeout for initial connection
    setTimeout(() => {
      if (!socket.connected) {
        connectionPromise = null
        reject(new Error('Socket connection timeout'))
      }
    }, 10000)
  })

  return connectionPromise
}

/**
 * Get the current socket instance
 * @returns {Socket|null}
 */
export function getSocket() {
  return socket
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    connectionPromise = null
    console.log('🔌 Socket.IO manually disconnected')
  }
}

/**
 * Join a lobby's Socket.IO room (after REST API join)
 * @param {string} lobbyCode - The 6-character lobby code
 */
export async function joinRoom(lobbyCode) {
  const s = await initSocket()
  return new Promise((resolve, reject) => {
    s.emit('join_room', { lobby_code: lobbyCode })
    
    const timeout = setTimeout(() => {
      reject(new Error('Join room timeout'))
    }, 5000)
    
    s.once('room_joined', (data) => {
      clearTimeout(timeout)
      console.log('🏠 Joined room:', data)
      resolve(data)
    })
    
    s.once('error', (error) => {
      clearTimeout(timeout)
      reject(new Error(error.message))
    })
  })
}

/**
 * Leave a lobby's Socket.IO room
 * @param {string} lobbyCode - The 6-character lobby code
 */
export async function leaveRoom(lobbyCode) {
  const s = await initSocket()
  s.emit('leave_room', { lobby_code: lobbyCode })
}

/**
 * Send a chat message
 * @param {string} lobbyCode - The lobby code
 * @param {string} message - The message text
 */
export async function sendMessage(lobbyCode, message) {
  const s = await initSocket()
  s.emit('send_message', { lobby_code: lobbyCode, message })
}

/**
 * Submit an answer during a game
 * @param {string} lobbyCode - The lobby code
 * @param {string} answer - The selected answer
 * @param {number} timeTaken - Time taken in seconds
 */
export async function submitGameAnswer(lobbyCode, answer, timeTaken) {
  const s = await initSocket()
  return new Promise((resolve, reject) => {
    console.log('Submitting answer:', { lobby_code: lobbyCode, answer, time_taken: timeTaken })
    s.emit('submit_answer', { 
      lobby_code: lobbyCode, 
      answer, 
      time_taken: timeTaken 
    })
    
    const timeout = setTimeout(() => {
      console.log('Answer submission timed out')
      reject(new Error('Answer submission timeout'))
    }, 5000)
    
    s.once('answer_recorded', (data) => {
      console.log('Received answer_recorded event:', data)
      clearTimeout(timeout)
      resolve(data)
    })
    
    s.once('error', (error) => {
      console.log('Received error event:', error)
      clearTimeout(timeout)
      reject(new Error(error.message))
    })
  })
}

/**
 * Subscribe to lobby events
 * @param {Object} handlers - Event handler functions
 */
export function subscribeLobbyEvents(handlers) {
  if (!socket) {
    console.warn('Socket not connected - cannot subscribe to events')
    return () => {}
  }

  const eventMap = {
    'player_joined': handlers.onPlayerJoined,
    'player_left': handlers.onPlayerLeft,
    'player_ready': handlers.onPlayerReady,
    'lobby_updated': handlers.onLobbyUpdated,
    'settings_updated': handlers.onSettingsUpdated,
    'lobby_closed': handlers.onLobbyClosed,
    'all_players_ready': handlers.onAllPlayersReady,
    'player_disconnected': handlers.onPlayerDisconnected,
    'countdown_started': handlers.onCountdownStarted,
    'game_started': handlers.onGameStarted,
    'question_started': handlers.onQuestionStarted,
    'player_answered': handlers.onPlayerAnswered,
    'question_ended': handlers.onQuestionEnded,
    'game_ended': handlers.onGameEnded,
    'new_message': handlers.onNewMessage,
    'scores_updated': handlers.onScoresUpdated,
  }

  // Subscribe to all provided handlers
  Object.entries(eventMap).forEach(([event, handler]) => {
    if (handler) {
      socket.on(event, handler)
    }
  })

  // Return unsubscribe function
  return () => {
    Object.entries(eventMap).forEach(([event, handler]) => {
      if (handler) {
        socket.off(event, handler)
      }
    })
  }
}

/**
 * Create a mock socket for frontend-only development
 */
function createMockSocket() {
  const mockSocket = {
    connected: true,
    id: 'mock-socket-id',
    emit: (event, data) => {
      console.log('🎭 Mock socket emit:', event, data)
      
      // Simulate responses
      if (event === 'join_room') {
        setTimeout(() => {
          mockSocket._trigger('room_joined', { lobby_code: data.lobby_code })
        }, 100)
      }
    },
    on: (event, handler) => {
      mockSocket._handlers = mockSocket._handlers || {}
      mockSocket._handlers[event] = mockSocket._handlers[event] || []
      mockSocket._handlers[event].push(handler)
    },
    off: (event, handler) => {
      if (mockSocket._handlers?.[event]) {
        mockSocket._handlers[event] = mockSocket._handlers[event].filter(h => h !== handler)
      }
    },
    once: (event, handler) => {
      const wrappedHandler = (...args) => {
        handler(...args)
        mockSocket.off(event, wrappedHandler)
      }
      mockSocket.on(event, wrappedHandler)
    },
    disconnect: () => {
      mockSocket.connected = false
      console.log('🎭 Mock socket disconnected')
    },
    _trigger: (event, data) => {
      const handlers = mockSocket._handlers?.[event] || []
      handlers.forEach(h => h(data))
    },
    _handlers: {}
  }
  
  return mockSocket
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  sendMessage,
  submitGameAnswer,
  subscribeLobbyEvents,
}
