import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Users, Copy, Play, ArrowLeft, Check, Loader2, Crown, Settings as SettingsIcon, AlertCircle, CircleAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { selectUser } from '../store/slices/authSlice'
import { joinLobby as joinLobbyAction, leaveLobby as leaveLobbyAction, updateLobbyData, clearLobbyState } from '../store/slices/lobbySlice'
import { getLobbyDetails, leaveLobby, toggleReady, startGame, getCategoriesWithSubjects, updateLobbySettings } from '../api/quizAPI'
import socketService from '../api/socketService'
import RetroSelect from '../components/ui/RetroSelect'
import { useLobbyChatContext } from '../contexts/LobbyChatContext'
import { CATEGORY_SECTIONS } from '../constants/categoryGroups'

// Calculate time until next UTC midnight
const getTimeUntilMidnightUTC = () => {
  const now = new Date()
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ))
  return Math.floor((tomorrow.getTime() - now.getTime()) / 1000)
}

// Format time until midnight for display
const formatTimeUntilMidnight = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours}h ${minutes}m ${secs}s until reset`
}

const LobbyView = () => {
  const { lobbyId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const currentUser = useSelector(selectUser)
  const token = currentUser?.token
  
  const [lobby, setLobby] = useState(null)
  const [players, setPlayers] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rateLimitInfo, setRateLimitInfo] = useState(null)
  const [timeUntilReset, setTimeUntilReset] = useState(0)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(null)
  
  // Use chat context for right sidebar
  const { setChatMessages, setLobbyId } = useLobbyChatContext()
  
  // Set lobby ID in context when available
  useEffect(() => {
    if (lobbyId) {
      setLobbyId(lobbyId)
    }
  }, [lobbyId, setLobbyId])
  
  // Settings state
  const [categories, setCategories] = useState({}) // All available categories with subjects
  const [questionTimer, setQuestionTimer] = useState(30)
  const [maxPlayers, setMaxPlayers] = useState(8)
  
  // Game configuration (like singleplayer)
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState(2)
  const [questionCount, setQuestionCount] = useState(1)
  
  // Quiz Contents - list of question sets added by host
  const [quizContents, setQuizContents] = useState([])

  // Debounced save of timer settings when host changes them
  const timerSaveRef = useRef(null)
  const initialTimerLoadRef = useRef(true)
  useEffect(() => {
    // Skip the initial load (when timer is set from fetched lobby data)
    if (initialTimerLoadRef.current) {
      initialTimerLoadRef.current = false
      return
    }
    if (!isHost) return

    clearTimeout(timerSaveRef.current)
    timerSaveRef.current = setTimeout(async () => {
      try {
        await updateLobbySettings(lobbyId, { question_timer: questionTimer })
        console.log('⏱️ Timer setting saved:', questionTimer)
      } catch (err) {
        console.warn('⚠️ Failed to save timer setting:', err)
      }
    }, 500)

    return () => clearTimeout(timerSaveRef.current)
  }, [questionTimer, isHost, lobbyId])

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesWithSubjects()
        console.log('📚 Categories fetched:', data)
        console.log('📚 Categories keys:', Object.keys(data))
        setCategories(data)
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [])

  // Fetch initial lobby data
  useEffect(() => {
    const fetchLobby = async () => {
      try {
        setLoading(true)
        const data = await getLobbyDetails(lobbyId)

        // Check lobby status — block entry to completed or in-progress lobbies
        const lobbyStatus = data.lobby.status
        if (lobbyStatus === 'completed') {
          setError('This game has ended. The lobby is no longer active.')
          dispatch(clearLobbyState())
          setLoading(false)
          return
        }
        if (lobbyStatus === 'in_progress') {
          setError('A game is currently in progress in this lobby.')
          dispatch(clearLobbyState())
          setLoading(false)
          return
        }

        // Check if current user is a player in this lobby
        const myPlayer = (data.lobby.players || []).find(p => p.user_id === currentUser?.id)
        if (!myPlayer) {
          setError('You are not a member of this lobby.')
          dispatch(clearLobbyState())
          setLoading(false)
          return
        }

        setLobby(data.lobby)
        setPlayers(data.lobby.players || [])
        
        // Determine if user is host
        const isUserHost = data.lobby.creator_id === currentUser?.id
        console.log('👑 Host check:', {
          creator_id: data.lobby.creator_id,
          creator_id_type: typeof data.lobby.creator_id,
          current_user_id: currentUser?.id,
          current_user_id_type: typeof currentUser?.id,
          isHost: isUserHost,
          strict_equality: data.lobby.creator_id === currentUser?.id,
          loose_equality: data.lobby.creator_id == currentUser?.id,
          creator_username: data.lobby.creator_username,
          current_username: currentUser?.username,
          currentUser: currentUser
        })
        setIsHost(isUserHost)
        
        // Initialize settings from lobby data (no fallbacks - lobby must have these)
        setQuestionTimer(data.lobby.question_timer)
        setMaxPlayers(data.lobby.max_players)
        setSelectedCategory(data.lobby.categories?.[0] || '')
        setSelectedDifficulty(data.lobby.difficulty)
        
        // Initialize quiz contents - check for undefined, not falsy (to allow empty array)
        if (data.lobby.question_list !== undefined) {
          console.log('📦 Initial quiz contents:', data.lobby.question_list)
          setQuizContents(data.lobby.question_list)
        }
        
        // Find current player's ready status (myPlayer already resolved above)
        setIsReady(myPlayer?.ready || false)
        
        // Store lobby membership in Redux for persistence
        dispatch(joinLobbyAction({ 
          lobbyCode: lobbyId, 
          lobbyData: data.lobby 
        }))
      } catch (err) {
        setError(err.message || 'Failed to load lobby')
      } finally {
        setLoading(false)
      }
    }

    if (lobbyId) {
      fetchLobby()
    }
  }, [lobbyId, currentUser?.id, dispatch])

  // Connect to WebSocket and set up event listeners
  useEffect(() => {
    if (!lobbyId || !token) return

    let unsubscribe = null

    const setupSocket = async () => {
      try {
        // Connect to socket
        await socketService.initSocket()

        // Join the socket room for this lobby (or rejoin if returning)
        console.log('🔌 Joining/rejoining socket room for lobby:', lobbyId)
        const joinResult = await socketService.joinRoom(lobbyId)
        
        // Load chat history if provided
        if (joinResult && joinResult.chat_history && joinResult.chat_history.length > 0) {
          const formattedHistory = joinResult.chat_history.map(msg => ({
            type: 'chat',
            username: msg.username,
            message: msg.message,
            timestamp: msg.timestamp
          }))
          setChatMessages(formattedHistory)
        }

        // Subscribe to all lobby events using the unified handler
        // Create stable handler references to prevent re-subscriptions
        const handleLobbyUpdated = (data) => {
          if (data.lobby && data.lobby.lobby_code !== lobbyId) return
          console.log('🔄 Lobby update:', data)
          if (data.lobby) {
            setLobby(data.lobby)
            setPlayers(data.lobby.players || [])
            setIsHost(data.lobby.creator_id === currentUser?.id)
            
            // DON'T update settings from lobby_updated (player join/ready events)
            // Only update from explicit settings_updated events
            
            // Update quiz contents - check for undefined, not falsy (to allow empty array)
            if (data.lobby.question_list !== undefined) {
              console.log('📦 Updating quiz contents from lobby update:', data.lobby.question_list)
              setQuizContents(data.lobby.question_list)
            }
            
            const myPlayer = data.lobby.players?.find(p => p.user_id === currentUser?.id)
            setIsReady(myPlayer?.ready || false)
            
            // Update Redux cache
            dispatch(updateLobbyData({ lobbyCode: lobbyId, lobbyData: data.lobby }))
          }
        }

        const handleSettingsUpdated = (data) => {
          if (data.lobby && data.lobby.lobby_code !== lobbyId) return
          console.log('⚙️ Settings updated:', data)
          if (data.lobby) {
            setLobby(data.lobby)
            // Update ALL settings from settings_updated event (this is the authoritative source)
            setQuestionTimer(data.lobby.question_timer)
            setMaxPlayers(data.lobby.max_players)
            setSelectedCategory(data.lobby.categories?.[0] || '')
            setSelectedDifficulty(data.lobby.difficulty || 2)
            
            // Update quiz contents - check for undefined, not falsy (to allow empty array)
            if (data.lobby.question_list !== undefined) {
              console.log('📦 Updating quiz contents from settings update:', data.lobby.question_list)
              setQuizContents(data.lobby.question_list)
            }
            
            // Settings update notification removed per user request
          }
        }

        const handlePlayerJoined = (data) => {
          if (data.lobby && data.lobby.lobby_code !== lobbyId) return
          console.log('Player joined:', data)
          setChatMessages(prev => [...prev, {
            type: 'system',
            message: `${data.username || 'A player'} joined the lobby`,
            timestamp: Date.now()
          }])
          
          // Update lobby state if provided
          if (data.lobby) {
            setLobby(data.lobby)
            setPlayers(data.lobby.players || [])
            dispatch(updateLobbyData({ lobbyCode: lobbyId, lobbyData: data.lobby }))
          }
        }

        unsubscribe = socketService.subscribeLobbyEvents({
          onLobbyUpdated: handleLobbyUpdated,
          onSettingsUpdated: handleSettingsUpdated,
          onPlayerJoined: handlePlayerJoined,
          onPlayerLeft: (data) => {
            if (data.lobby && data.lobby.lobby_code !== lobbyId) return
            console.log('Player left:', data)
            setChatMessages(prev => [...prev, {
              type: 'system',
              message: `${data.username || 'A player'} left the lobby`,
              timestamp: Date.now()
            }])
            
            // Update lobby state if provided
            if (data.lobby) {
              setLobby(data.lobby)
              setPlayers(data.lobby.players || [])
              setIsHost(data.lobby.creator_id === currentUser?.id)
            }
          },
          onPlayerReady: (data) => {
            if (data.lobby && data.lobby.lobby_code !== lobbyId) return
            console.log('Player ready:', data)
            // Update lobby state if provided
            if (data.lobby) {
              setLobby(data.lobby)
              setPlayers(data.lobby.players || [])
              
              const myPlayer = data.lobby.players?.find(p => p.user_id === currentUser?.id)
              setIsReady(myPlayer?.ready || false)
            }
          },
          onCountdownStarted: (data) => {
            if (data.lobby && data.lobby.lobby_code !== lobbyId) return
            console.log('Countdown started:', data)
            setCountdown(data.seconds)
          },
          onGameStarted: (data) => {
            // Game started event might not have lobby object directly, but usually has lobby_code or similar
            // Let's check if we can validate it. 
            // If not, we might redirect wrongly.
            // But usually game_started comes after countdown, so it's likely fine.
            console.log('Game started:', data)
            // Navigate to battle view with game data
            navigate(`/battle/${lobbyId}`, { state: { gameData: data } })
          },
          onNewMessage: (data) => {
            console.log('\ud83d\udcac Received new_message event:', data)
            setChatMessages(prev => {
              // Deduplicate: check if this exact message already exists
              const isDuplicate = prev.some(msg => 
                msg.type === 'chat' && 
                msg.username === data.username && 
                msg.message === data.message &&
                Math.abs((msg.timestamp || 0) - (data.timestamp || Date.now())) < 1000 // Within 1 second
              )
              
              if (isDuplicate) {
                console.log('\u26a0\ufe0f Duplicate message detected, ignoring')
                return prev
              }
              
              return [...prev, {
                type: 'chat',
                username: data.username,
                message: data.message,
                timestamp: data.timestamp || Date.now()
              }]
            })
          }
        })

        // Also listen for errors on the socket directly
        const socket = socketService.getSocket()
        if (socket) {
          socket.on('error', (data) => {
            console.error('Socket error:', data)
            setError(data.message)
          })
        }
      } catch (err) {
        console.error('Failed to setup socket:', err)
        setError('Failed to connect to lobby')
      }
    }

    setupSocket()

    return () => {
      if (unsubscribe) unsubscribe()
      // We do NOT leave the room or lobby here anymore, to allow navigation without leaving the lobby
      // The user stays in the lobby until they explicitly click "LEAVE LOBBY"
      // socketService.leaveRoom(lobbyId)
    }
  }, [lobbyId, token, currentUser?.id, navigate, dispatch])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(lobbyId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [lobbyId])

  const handleToggleReady = async () => {
    try {
      const newReady = !isReady
      await toggleReady(lobbyId, newReady)
      setIsReady(newReady)
      // Event will be broadcast via Redis pub/sub from backend
    } catch (err) {
      console.error('Failed to toggle ready:', err)
    }
  }
  const handleStartGame = async () => {
    try {
      setError(null)
      
      // Save settings before starting game (must happen BEFORE startGame changes status to countdown)
      if (isHost) {
        console.log('💾 Saving settings before starting game')
        try {
          await updateLobbySettings(lobbyId, {
            question_timer: questionTimer,
            max_players: maxPlayers,
            question_list: quizContents
          })
        } catch (settingsErr) {
          // If settings update fails (e.g., lobby already in countdown), continue anyway
          console.warn('⚠️ Failed to save settings, continuing with game start:', settingsErr)
        }
      }
      
      const response = await startGame(lobbyId)
      
      // RATE LIMITING TEMPORARILY DISABLED FOR TESTING
      // Check if response indicates rate limiting
      // if (response.isRateLimited) {
      //   setRateLimitInfo({
      //     limit: response.limit || 3,
      //     remaining: response.remaining || 0,
      //   })
      //   setError(response.error || 'Daily game limit reached. Resets at midnight UTC.')
      //   return
      // }
      
      // Event will be broadcast via Redis pub/sub from backend
    } catch (err) {
      console.error('Failed to start game:', err)
      
      // RATE LIMITING TEMPORARILY DISABLED FOR TESTING
      // Check if error message contains rate limit info
      // const errorMsg = err.message || 'Failed to start game'
      // if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.includes('games per day') || errorMsg.includes('midnight utc')) {
      //   setRateLimitInfo({
      //     limit: 3, // Default limit
      //     remaining: 0,
      //   })
      // }
      
      setError(err.message || 'Failed to start game')
    }
  }

  // Update countdown every second when rate limited
  useEffect(() => {
    if (!rateLimitInfo) {
      setTimeUntilReset(0)
      return
    }
    
    const updateCountdown = () => {
      const remaining = getTimeUntilMidnightUTC()
      setTimeUntilReset(remaining)
      
      // Clear rate limit when midnight passes
      if (remaining <= 0) {
        setRateLimitInfo(null)
        setError(null)
      }
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(interval)
  }, [rateLimitInfo])

  const handleLeave = async () => {
    try {
      // Call API to leave lobby
      await leaveLobby(lobbyId)
      // Leave the socket room
      socketService.leaveRoom(lobbyId)
      // Clear lobby state from Redux
      dispatch(leaveLobbyAction())
      // Clear lobby ID from chat context
      setLobbyId(null)
      // Navigate home
      navigate('/')
    } catch (err) {
      console.error('Failed to leave lobby:', err)
      // Still clear state and navigate even if API call fails
      dispatch(leaveLobbyAction())
      setLobbyId(null)
      navigate('/')
    }
  }

  const handleAddQuestions = async () => {
    if (!selectedCategory) {
      return // Silently prevent adding without showing alert
    }

    // Create a new question set entry (no subject — backend picks a random one)
    const newQuestionSet = {
      id: Date.now(), // Unique ID for this set
      category: selectedCategory,
      difficulty: selectedDifficulty,
      count: questionCount
    }

    const updatedQuizContents = [...quizContents, newQuestionSet]
    
    // Update backend with new quiz contents
    try {
      console.log('📝 Updating quiz contents:', updatedQuizContents)
      const response = await updateLobbySettings(lobbyId, {
        question_timer: questionTimer,
        max_players: maxPlayers,
        question_list: updatedQuizContents
      })
      console.log('✅ Quiz contents updated:', response)
      setQuizContents(updatedQuizContents)
    } catch (err) {
      console.error('❌ Failed to update quiz contents:', err)
      // Don't update local state on error
    }
    
    // Reset question count to 1 after adding
    setQuestionCount(1)
  }

  const handleRemoveQuestionSet = async (setId) => {
    const updatedQuizContents = quizContents.filter(set => set.id !== setId)
    
    // Update backend with updated quiz contents
    try {
      console.log('🗑️ Removing question set:', setId)
      const response = await updateLobbySettings(lobbyId, {
        question_timer: questionTimer,
        max_players: maxPlayers,
        question_list: updatedQuizContents
      })
      console.log('✅ Quiz contents updated after removal:', response)
      setQuizContents(updatedQuizContents)
    } catch (err) {
      console.error('❌ Failed to remove question set:', err)
      // Don't update local state on error
    }
  }

  const getTotalQuestions = () => {
    return quizContents.reduce((sum, set) => sum + set.count, 0)
  }

  const allReady = players.length >= 1 && players.every(p => p.ready)
  const hasValidQuiz = quizContents.length > 0 && getTotalQuestions() >= 1
  const canStart = isHost && allReady && hasValidQuiz && !countdown

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-accent-primary animate-spin mb-4" />
        <p className="font-orbitron text-text-secondary animate-pulse">LOADING LOBBY...</p>
      </div>
    )
  }

  if (error && !lobby) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="font-arcade text-xl text-white mb-2">LOBBY NOT FOUND</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/80 rounded-xl text-white font-orbitron"
        >
          BACK TO HOME
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
        {/* Left: Leave Button */}
        <button
          onClick={handleLeave}
          disabled={countdown}
          className={`px-3 sm:px-4 py-2 rounded-xl font-arcade text-sm sm:text-base text-white transition-all flex items-center justify-center gap-2 bg-red-500/20 border-2 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:border-red-500 ${
            countdown ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          LEAVE
        </button>

        {/* Center: Title or Countdown */}
        {countdown ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-4 sm:px-6 py-2 bg-accent-primary/20 border border-accent-primary rounded-xl text-center"
          >
            <span className="font-arcade text-xl sm:text-2xl text-accent-primary">
              Loading game...
            </span>
          </motion.div>
        ) : (
          <h1 className="font-arcade text-2xl sm:text-3xl text-white text-center">BATTLE LOBBY</h1>
        )}

        {/* Right: Start Game Button (Host Only) */}
        {isHost ? (
          <div className="relative group">
            <button 
              onClick={handleStartGame}
              disabled={!canStart || rateLimitInfo}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-arcade text-sm sm:text-base text-white transition-all flex items-center justify-center gap-2 ${
                canStart && !rateLimitInfo
                  ? 'bg-gradient-to-r from-accent-primary to-accent-secondary shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_30px_rgba(217,70,239,0.6)]' 
                  : 'bg-white/10 text-text-muted cursor-not-allowed'
              }`}
            >
              <Play className="w-4 sm:w-5 h-4 sm:h-5" /> 
              START GAME
            </button>
            
            {/* Hover tooltips for disabled states */}
            {rateLimitInfo && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/90 text-white text-xs px-3 py-2 rounded font-orbitron whitespace-nowrap pointer-events-none z-50 min-w-max">
                <div className="flex flex-col items-center gap-1">
                  <CircleAlert className="w-4 h-4" />
                  <div className="font-bold">DAILY LIMIT REACHED</div>
                  <div>{rateLimitInfo.limit} games per day</div>
                  <div className="text-accent-primary">{formatTimeUntilMidnight(timeUntilReset)}</div>
                </div>
              </div>
            )}
            {!canStart && !rateLimitInfo && !countdown && players.length >= 1 && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/90 text-white text-xs px-3 py-2 rounded font-orbitron whitespace-nowrap pointer-events-none z-50">
                {!allReady && 'All players must be ready'}
                {allReady && !hasValidQuiz && 'Add questions first'}
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:block sm:w-[180px]" />
        )}
      </div>

      {/* Main Lobby Content */}
      <div className="space-y-4 min-w-0">
          {/* Lobby Code */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center overflow-hidden"
          >
            <h2 className="font-orbitron text-text-secondary text-sm tracking-widest mb-2">LOBBY CODE</h2>
            <div 
              onClick={copyCode}
              className="font-arcade text-2xl sm:text-3xl md:text-4xl text-accent-primary tracking-widest cursor-pointer hover:scale-105 transition-transform flex items-center justify-center gap-2 sm:gap-4 group overflow-hidden"
            >
              <span className="truncate">{lobbyId}</span>
              {copied ? (
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
              ) : (
                <Copy className="w-5 h-5 sm:w-6 sm:h-6 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {copied ? 'Copied!' : 'Click to copy and share with friends'}
            </p>
          </motion.div>

          {/* Players List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-card/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col h-[160px] sm:h-[190px]"
          >
            <h3 className="font-orbitron text-sm sm:text-base text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Users className="w-4 sm:w-5 h-4 sm:h-5 text-accent-secondary" />
              PLAYERS ({players.length}/{lobby?.max_players || 8})
            </h3>
            <div className="space-y-2 flex-1 overflow-y-auto pr-2">
              <AnimatePresence>
                {players.map((player, index) => (
                  <motion.div 
                    key={player.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {player.user_id === lobby?.creator_id && (
                        <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      )}
                      <span className="font-orbitron text-xs sm:text-sm text-white truncate">
                        {player.username}
                        {player.user_id === currentUser?.id && ' (YOU)'}
                      </span>
                    </div>
                    <button
                      onClick={player.user_id === currentUser?.id ? handleToggleReady : undefined}
                      disabled={player.user_id !== currentUser?.id || countdown}
                      className={`text-xs px-3 sm:px-4 py-1.5 rounded-full font-orbitron transition-all whitespace-nowrap flex-shrink-0 ${
                        player.ready 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                          : 'bg-white/10 text-white border border-white/20'
                      } ${player.user_id === currentUser?.id && !countdown ? 'hover:border-white/40 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      {player.ready ? 'READY ✓' : 'CLICK WHEN READY'}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {players.length === 0 && (
                <p className="text-center text-text-muted text-sm py-4 font-orbitron">
                  Waiting for players...
                </p>
              )}
            </div>
          </motion.div>

          {/* Game Settings and Quiz Contents - Side by Side on Desktop, Stacked on Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Game Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-bg-card/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col h-[460px]"
            >
              <h3 className="font-orbitron text-sm sm:text-base text-white flex items-center gap-2 mb-4">
                <SettingsIcon className="w-4 sm:w-5 h-4 sm:h-5 text-accent-secondary" />
                GAME SETTINGS
              </h3>

              <div className="flex-1 overflow-y-auto space-y-4 px-2 relative group">
                {!isHost && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacit-y bg-red-500/95 text-white text-sm px-4 py-3 rounded-lg font-orbitron z-10 pointer-events-none">
                    <div className="text-center flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8" />
                      <div className="font-bold">HOST ONLY</div>
                      <div className="text-xs">Only the lobby creator can modify game settings</div>
                    </div>
                  </div>
                )}
                {/* Section Selection (top-level group) */}
                <div>
                  <label className="block text-text-muted text-xs mb-2 font-orbitron">SECTION</label>
                  <RetroSelect
                    value={selectedSection}
                    onChange={(val) => {
                      setSelectedSection(val)
                      setSelectedCategory('') // Reset category when section changes
                    }}
                    options={CATEGORY_SECTIONS.map(s => ({ value: s.id, label: s.name }))}
                    placeholder="Select section..."
                    disabled={!isHost}
                  />
                </div>

                {/* Category Selection (subcategory within section) */}
                <div>
                  <label className="block text-text-muted text-xs mb-2 font-orbitron">CATEGORY</label>
                  <RetroSelect
                    value={selectedCategory}
                    onChange={(val) => {
                      setSelectedCategory(val)
                    }}
                    options={
                      selectedSection
                        ? (CATEGORY_SECTIONS.find(s => s.id === selectedSection)?.categories || []).map(cat => ({ value: cat, label: cat }))
                        : []
                    }
                    placeholder={selectedSection ? 'Select category...' : 'Choose section first'}
                    disabled={!isHost}
                  />
                </div>

                {/* Difficulty Selection */}
                <div>
                  <label className="block text-text-muted text-xs mb-2 font-orbitron">DIFFICULTY</label>
                  <RetroSelect
                    value={selectedDifficulty}
                    onChange={(val) => setSelectedDifficulty(val)}
                    options={[
                      { value: 1, label: 'Easy' },
                      { value: 2, label: 'Medium' },
                      { value: 3, label: 'Hard' }
                    ]}
                    placeholder="Select difficulty..."
                    disabled={!isHost}
                  />
                </div>

                {/* Question Count */}
                <div>
                  <label className="block text-text-muted text-xs mb-2 font-orbitron">NUMBER OF QUESTIONS</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                      disabled={!isHost || questionCount <= 1}
                      className="w-10 h-10 bg-[#121212] border border-white/10 rounded-lg text-white font-arcade text-sm hover:border-accent-primary hover:text-accent-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-white"
                    >
                      -
                    </button>
                    <div className="flex-1 bg-[#121212] border border-white/10 rounded-lg p-3 text-center">
                      <span className="font-arcade text-accent-primary text-sm">{questionCount}</span>
                      <span className="text-text-muted text-xs ml-2 font-orbitron">QUESTIONS</span>
                    </div>
                    <button
                      onClick={() => setQuestionCount(Math.min(50, questionCount + 1))}
                      disabled={!isHost || questionCount >= 50}
                      className="w-10 h-10 bg-[#121212] border border-white/10 rounded-lg text-white font-arcade text-sm hover:border-accent-primary hover:text-accent-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add Question Button - Creator Only */}
                {isHost && !countdown && (
                  <button
                    onClick={handleAddQuestions}
                    disabled={!selectedCategory}
                    className="w-full py-3 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-lg font-arcade text-white text-sm hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ADD QUESTIONS
                  </button>
                )}
              </div>
            </motion.div>

            {/* Quiz Contents */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-bg-card/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col h-[460px]"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="font-orbitron text-sm sm:text-base text-white flex items-center gap-2 flex-shrink-0">
                  <SettingsIcon className="w-4 sm:w-5 h-4 sm:h-5 text-accent-secondary" />
                  <span className="hidden sm:inline">QUIZ CONTENTS</span>
                  <span className="sm:hidden">QUIZ</span>
                </h3>
                <div className="text-xs font-orbitron text-text-muted flex items-center gap-1 min-w-0">
                  <span className="text-accent-primary font-arcade flex-shrink-0">{getTotalQuestions()}</span>
                  <span className="hidden xs:inline truncate">TOTAL QUESTIONS</span>
                  <span className="xs:hidden">QS</span>
                </div>
              </div>

              {/* Round Timer - Moved from Game Settings */}
              <div className="mb-4">
                <label className="block text-text-muted text-xs mb-2 font-orbitron">ROUND TIMER</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuestionTimer(Math.max(10, questionTimer - 5))}
                    disabled={!isHost || countdown || questionTimer <= 10}
                    className="w-10 h-10 bg-[#121212] border border-white/10 rounded-lg text-white font-arcade text-sm hover:border-accent-primary hover:text-accent-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-white"
                  >
                    -
                  </button>
                  <div className="flex-1 bg-[#121212] border border-white/10 rounded-lg p-3 text-center">
                    <span className="font-arcade text-accent-primary text-sm">{questionTimer}</span>
                    <span className="text-text-muted text-xs ml-2 font-orbitron">SECONDS</span>
                  </div>
                  <button
                    onClick={() => setQuestionTimer(Math.min(120, questionTimer + 5))}
                    disabled={!isHost || countdown || questionTimer >= 120}
                    className="w-10 h-10 bg-[#121212] border border-white/10 rounded-lg text-white font-arcade text-sm hover:border-accent-primary hover:text-accent-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Scrollable Quiz Contents List */}
              <div className="flex-1 overflow-y-auto pr-2 relative group">
                {!isHost && quizContents.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/95 text-white text-sm px-4 py-3 rounded-lg font-orbitron z-10 pointer-events-none">
                    <div className="text-center flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8" />
                      <div className="font-bold">HOST ONLY</div>
                      <div className="text-xs">Only the lobby creator can remove questions</div>
                    </div>
                  </div>
                )}
                {quizContents.length === 0 ? (
                  <div className="text-center py-8 text-text-muted text-sm font-orbitron">
                    No questions added yet
                    {isHost && <div className="mt-2 text-xs">Use the settings to add questions</div>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quizContents.map((set, index) => (
                      <div 
                        key={set.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 bg-accent-primary/20 border border-accent-primary/50 rounded-lg flex items-center justify-center">
                            <span className="font-arcade text-accent-primary text-xs">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-orbitron text-sm text-white">
                              {set.category}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                              <span className="font-orbitron">
                                {set.difficulty === 1 ? 'Easy' : set.difficulty === 2 ? 'Medium' : 'Hard'}
                              </span>
                              <span className="text-accent-secondary font-arcade">
                                {set.count} {set.count === 1 ? 'Question' : 'Questions'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isHost ? (
                          <button
                            onClick={() => handleRemoveQuestionSet(set.id)}
                            className="w-8 h-8 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 hover:border-red-500 transition-all flex items-center justify-center"
                          >
                            ×
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-8 h-8 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400/50 cursor-not-allowed flex items-center justify-center"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>


      </div>
    </div>
  )
}

export default LobbyView
