import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Clock, Target, Hash, Plus, Users, Trophy, BookOpen, LogOut, Github, Mail, History, Settings, CircleAlert, MessageCircle, Send, ExternalLink, Key, Bot, CheckCircle, Loader2, AlertCircle, Shuffle } from 'lucide-react'
import { selectActiveTab, setActiveTab, selectAnimatedBackground, toggleAnimatedBackground, setSelectedHistoryItem } from '../../store/slices/uiSlice'
import { selectCustomApiKey, selectSelectedModel, setCustomApiKey, setSelectedModel, clearCustomApiKey } from '../../store/slices/settingsSlice'
import { REQUIRES_USER_API_KEY } from '../../config.js'
import { getCategoriesWithSubjects, createLobby, joinLobby, getUserHistory, testAIConfiguration } from '../../api/quizAPI'
import { setGameSettings, selectRateLimitInfo, clearRateLimitInfo } from '../../store/slices/quizSlice'
import { logout } from '../../store/slices/authSlice'
import LeaderboardPanel from './LeaderboardPanel'
import RetroSelect from '../ui/RetroSelect'
import RetroInput from '../ui/RetroInput'
import CategorySectionGrid from '../ui/CategorySectionGrid'
import { useLobbyChatContext } from '../../contexts/LobbyChatContext'

// Rate limit countdown timer component
const RateLimitTimer = ({ resetTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0)
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = resetTime - now
      return remaining > 0 ? remaining : 0
    }
    
    setTimeLeft(calculateTimeLeft())
    
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onExpire?.()
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [resetTime, onExpire])
  
  if (timeLeft <= 0) return null
  
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="mt-6 p-5 rounded-xl bg-red-500/10 border border-red-500/40 flex flex-col items-center text-center"
    >
      <CircleAlert className="w-12 h-12 text-red-500 mb-3" />
      <p className="text-sm text-red-400 font-orbitron font-bold tracking-wide mb-2">RATE LIMITED</p>
      <p className="text-lg font-arcade text-red-300 tracking-widest">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
      <p className="text-xs text-red-400/60 mt-2">
        Try again when timer expires
      </p>
    </motion.div>
  )
}

const GameInitPanel = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [categories, setCategories] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [difficulty, setDifficulty] = useState('Medium')
  const rateLimitInfo = useSelector(selectRateLimitInfo)

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategoriesWithSubjects()
      setCategories(data)
    }
    loadCategories()
  }, [])

  const handleStartGame = () => {
    dispatch(setGameSettings({
      category: selectedCategory,
      subject: selectedSubject,
      difficulty: difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3
    }))
    dispatch(setActiveTab('play'))
    navigate('/play')
  }

  const handleFeelingLucky = () => {
    // Get all available categories
    const availableCategories = Object.keys(categories)
    if (availableCategories.length === 0) return

    // Pick random category
    const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)]
    
    // Pick random subject from that category
    const categorySubjects = categories[randomCategory] || []
    if (categorySubjects.length === 0) return
    const randomSubject = categorySubjects[Math.floor(Math.random() * categorySubjects.length)]
    
    // Pick random difficulty
    const difficulties = ['Easy', 'Medium', 'Hard']
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)]

    // Start game with random settings
    dispatch(setGameSettings({
      category: randomCategory,
      subject: randomSubject,
      difficulty: randomDifficulty === 'Easy' ? 1 : randomDifficulty === 'Medium' ? 2 : 3
    }))
    dispatch(setActiveTab('play'))
    navigate('/play')
  }

  const handleRateLimitExpire = () => {
    dispatch(clearRateLimitInfo())
  }

  const subjects = categories[selectedCategory] || []
  const isRateLimited = rateLimitInfo && rateLimitInfo.resetTime > Math.floor(Date.now() / 1000)

  return (
    <div className="space-y-4">
      {/* Category Section Grid */}
      <div className="space-y-2">
        <h3 className="text-accent-secondary font-arcade text-xs tracking-wider uppercase flex items-center gap-2">
          <Target className="w-4 h-4" /> Category
        </h3>
        <CategorySectionGrid
          availableCategories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={(category) => {
            setSelectedCategory(category)
            setSelectedSubject('')
          }}
        />
      </div>

      <AnimatePresence>
        {selectedCategory && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h3 className="text-accent-quaternary font-arcade text-xs tracking-wider uppercase flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Subject
            </h3>
            <RetroSelect
              value={selectedSubject}
              onChange={(value) => setSelectedSubject(value)}
              options={[
                { value: '', label: 'Select Subject...' },
                ...subjects.map(sub => ({ value: sub, label: sub }))
              ]}
              placeholder="Select Subject..."
              glowColor="accent-quaternary"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <h3 className="text-accent-primary font-arcade text-xs tracking-wider uppercase flex items-center gap-2">
          <Zap className="w-4 h-4" /> Difficulty
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {['Easy', 'Medium', 'Hard'].map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`p-2 rounded-lg border transition-all text-xs font-orbitron flex flex-col items-center justify-center gap-1 ${
                difficulty === level 
                  ? level === 'Easy' ? 'bg-green-500/20 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                    level === 'Medium' ? 'bg-yellow-500/20 border-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.3)]' :
                    'bg-red-500/20 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'border-white/10 bg-white/5 text-text-secondary ' + (
                    level === 'Easy' ? 'hover:border-green-500 hover:text-green-500' :
                    level === 'Medium' ? 'hover:border-yellow-500 hover:text-yellow-500' :
                    'hover:border-red-500 hover:text-red-500'
                  )
              }`}
            >
              <span>{level}</span>
              <span className="text-[10px] opacity-70">
                {level === 'Easy' ? '1x' : level === 'Medium' ? '1.5x' : '2x'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleStartGame}
        disabled={!selectedCategory || !selectedSubject}
        className={`w-full py-4 rounded-xl font-arcade text-white transition-all mt-6 ${
          !selectedCategory || !selectedSubject
            ? 'bg-white/5 text-text-muted cursor-not-allowed'
            : 'bg-gradient-to-r from-accent-quinary to-accent-secondary shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]'
        }`}
      >
        START GAME
      </motion.button>

      {/* I'm Feeling Lucky Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleFeelingLucky}
        disabled={Object.keys(categories).length === 0}
        className="w-full py-3 rounded-xl font-arcade text-xs text-white transition-all mt-2
          border border-accent-tertiary/50 bg-accent-tertiary/10
          hover:bg-accent-tertiary/20 hover:border-accent-tertiary
          hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        <Shuffle className="w-4 h-4" />
        I'M FEELING LUCKY
      </motion.button>
      
      <AnimatePresence>
        {isRateLimited && (
          <RateLimitTimer 
            resetTime={rateLimitInfo.resetTime} 
            onExpire={handleRateLimitExpire}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const SettingsPanel = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const animatedBackground = useSelector(selectAnimatedBackground)
  const customApiKey = useSelector(selectCustomApiKey)
  const selectedModel = useSelector(selectSelectedModel)
  
  // Check if user was redirected here to set API key
  const showApiKeyPrompt = location.state?.showApiKeyPrompt
  
  // AI configuration test state
  const [testStatus, setTestStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('')

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }
  
  const handleTestConfiguration = async () => {
    setTestStatus('loading')
    setTestMessage('')
    
    try {
      const result = await testAIConfiguration()
      
      if (result.ok) {
        setTestStatus('success')
        setTestMessage(result.message || `Connected successfully using ${result.model || selectedModel}`)
      } else {
        setTestStatus('error')
        setTestMessage(result.error || 'Configuration test failed')
      }
    } catch (error) {
      setTestStatus('error')
      setTestMessage(error.message || 'Failed to test configuration')
    }
    
    // Clear status after 5 seconds
    setTimeout(() => {
      setTestStatus(null)
      setTestMessage('')
    }, 5000)
  }

  return (
    <div className="space-y-6">
      {/* API Key Prompt Banner - show when user must provide their own API key */}
      {showApiKeyPrompt && !customApiKey && REQUIRES_USER_API_KEY && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-start gap-3"
        >
          <Key className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-orbitron text-sm text-white mb-1">Set Your OpenAI API Key</p>
            <p className="text-xs text-text-secondary">
              Add your API key below to start playing. You can get one from{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                OpenAI
              </a>.
            </p>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        <h3 className="text-slate-400 font-orbitron text-sm tracking-wider uppercase flex items-center gap-2">
          <Settings className="w-4 h-4" /> Display
        </h3>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5" />
            <span className="font-orbitron text-sm">Animated Background</span>
          </div>
          <button
            onClick={() => dispatch(toggleAnimatedBackground())}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              animatedBackground ? 'bg-accent-primary' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                animatedBackground ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* AI Configuration Section */}
      <div className="space-y-4">
        <h3 className="text-slate-400 font-orbitron text-sm tracking-wider uppercase flex items-center gap-2">
          <Bot className="w-4 h-4" /> AI Configuration
        </h3>
        
        {/* Status indicator */}
        <div className={`p-3 rounded-xl flex items-center gap-3 ${
          customApiKey 
            ? 'bg-accent-secondary/10 border border-accent-secondary/30' 
            : REQUIRES_USER_API_KEY 
              ? 'bg-amber-500/10 border border-amber-500/30'
              : 'bg-green-500/10 border border-green-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            customApiKey 
              ? 'bg-accent-secondary' 
              : REQUIRES_USER_API_KEY 
                ? 'bg-amber-500'
                : 'bg-green-500'
          }`} />
          <span className="text-xs font-orbitron">
            {customApiKey 
              ? 'Using your API key' 
              : REQUIRES_USER_API_KEY 
                ? 'No API key set'
                : 'Using server API key (gpt-4o-mini)'}
          </span>
        </div>
        
        {/* Custom API Key */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-accent-secondary" />
              <span className="font-orbitron text-sm">OpenAI API Key</span>
            </div>
            {customApiKey && (
              <button
                onClick={() => dispatch(clearCustomApiKey())}
                className="text-xs text-red-400 hover:text-red-300 font-orbitron transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <RetroInput
            type="password"
            value={customApiKey}
            onChange={(value) => dispatch(setCustomApiKey(value))}
            placeholder="sk-..."
            showVisibilityToggle={true}
          />
          <p className="text-xs text-text-muted">
            {REQUIRES_USER_API_KEY 
              ? 'Required: Enter your OpenAI API key to play. Get one at platform.openai.com'
              : 'Optional: Use your own key for custom models. Leave empty to use server default.'}
          </p>
        </div>

        {/* Model Selection */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent-primary" />
            <span className="font-orbitron text-sm">AI Model</span>
          </div>
          <RetroInput
            type="text"
            value={selectedModel}
            onChange={(value) => dispatch(setSelectedModel(value))}
            placeholder="gpt-4o-mini"
          />
          <a 
            href="https://platform.openai.com/docs/models" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-accent-secondary hover:text-accent-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View available models
          </a>
        </div>
        
        {/* Test Configuration Button */}
        <button
          onClick={handleTestConfiguration}
          disabled={testStatus === 'loading'}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl font-orbitron text-sm transition-all ${
            testStatus === 'success'
              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
              : testStatus === 'error'
              ? 'bg-red-500/20 border border-red-500/50 text-red-400'
              : 'bg-accent-secondary/20 border border-accent-secondary/50 text-accent-secondary hover:bg-accent-secondary/30'
          } ${testStatus === 'loading' ? 'opacity-60 cursor-wait' : ''}`}
        >
          {testStatus === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : testStatus === 'success' ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Success!
            </>
          ) : testStatus === 'error' ? (
            <>
              <AlertCircle className="w-4 h-4" />
              Failed
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Test Configuration
            </>
          )}
        </button>
        
        {/* Test result message */}
        <AnimatePresence>
          {testMessage && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`text-xs px-2 ${
                testStatus === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {testMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-400 font-orbitron text-sm tracking-wider uppercase flex items-center gap-2">
          <Settings className="w-4 h-4" /> Account
        </h3>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all group"
        >
          <span className="font-orbitron text-sm">Logout</span>
          <LogOut className="w-4 h-4 opacity-50 group-hover:opacity-100" />
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-400 font-orbitron text-sm tracking-wider uppercase flex items-center gap-2">
          <Users className="w-4 h-4" /> Community
        </h3>
        <a 
          href="https://github.com/liav-hasson" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5" />
            <span className="font-orbitron text-sm">GitHub</span>
          </div>
          <span className="text-xs text-text-secondary group-hover:text-white">View Repo</span>
        </a>
        
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all group cursor-pointer">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" />
            <span className="font-orbitron text-sm">Contact</span>
          </div>
          <span className="text-xs text-text-secondary group-hover:text-white">Report Issue</span>
        </div>
      </div>
    </div>
  )
}

const HistoryPanel = () => {
  const dispatch = useDispatch()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getUserHistory({ limit: 10 })
        setHistory(data)
      } catch (error) {
        console.error('Failed to fetch history:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) {
    return <div className="text-center text-text-muted font-orbitron text-xs animate-pulse">LOADING HISTORY...</div>
  }

  if (history.length === 0) {
    return <div className="text-center text-text-muted font-orbitron text-xs">NO GAMES PLAYED YET</div>
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div 
          key={entry.id} 
          onClick={() => dispatch(setSelectedHistoryItem(entry))}
          className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-orbitron text-accent-secondary">{entry.summary.category}</span>
            <span className={`text-xs font-arcade ${entry.summary.score >= 7 ? 'text-green-400' : 'text-orange-400'}`}>
              {String(entry.summary.score).includes('/') ? entry.summary.score : `${entry.summary.score}/10`}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-text-muted">
            <span>{new Date(entry.summary.created_at).toLocaleDateString()}</span>
            <span className="uppercase">{entry.summary.difficulty === 1 ? 'Easy' : entry.summary.difficulty === 2 ? 'Medium' : 'Hard'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const MultiplayerPanel = () => {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const handleCreateLobby = async () => {
    setIsCreating(true)
    try {
      const result = await createLobby({})
      console.log('Lobby created:', result)
      if (result.code) {
        navigate(`/lobby/${result.code}`)
      } else {
        alert('Failed to create lobby: No code returned')
      }
    } catch (error) {
      console.error('Failed to create lobby:', error)
      alert('Failed to create lobby')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinLobby = async () => {
    if (!joinCode) return
    setIsJoining(true)
    try {
      const result = await joinLobby(joinCode)
      console.log('Joined lobby:', result)
      navigate(`/lobby/${joinCode}`)
    } catch (error) {
      alert('Failed to join: ' + error.message)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/30">
        <h3 className="text-accent-primary font-arcade text-sm mb-2">CREATE LOBBY</h3>
        <p className="text-xs text-text-secondary mb-4">Host a game and invite friends.</p>
        <button 
          onClick={handleCreateLobby}
          disabled={isCreating}
          className="w-full py-2 bg-accent-primary/20 hover:bg-accent-primary/30 border border-accent-primary/50 rounded-lg text-accent-primary font-orbitron text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(217,70,239,0.2)] hover:shadow-[0_0_15px_rgba(217,70,239,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {isCreating ? 'Creating...' : 'Create New'}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-bg-card px-2 text-text-muted">Or Join</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-accent-secondary font-orbitron text-sm tracking-wider uppercase flex items-center gap-2">
          <Hash className="w-4 h-4" /> Game Code
        </h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE" 
            className="flex-1 bg-bg-card-light border border-white/10 rounded-lg p-3 text-text-primary focus:border-accent-secondary outline-none font-arcade text-sm tracking-widest uppercase placeholder:text-white/20"
          />
          <button 
            onClick={handleJoinLobby}
            disabled={!joinCode || isJoining}
            className="px-4 bg-accent-secondary/20 hover:bg-accent-secondary/30 border border-accent-secondary/50 rounded-lg text-accent-secondary transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? '...' : 'JOIN'}
          </button>
        </div>
      </div>
    </div>
  )
}

const LobbyChatPanel = () => {
  const { chatMessages, chatInput, setChatInput, handleSendMessage, lobbyId, setChatMessages } = useLobbyChatContext()
  const chatEndRef = useRef(null)
  const prevLobbyIdRef = useRef(null)

  // Color bank for usernames
  const userColors = [
    '#06b6d4', // cyan
    '#8b5cf6', // violet 
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f97316', // orange
  ]

  // Assign consistent color to each user
  const getUserColor = (username) => {
    if (!username) return userColors[0]
    const hash = username.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
    return userColors[hash % userColors.length]
  }

  // Chat clearing is now handled by LobbyChatContext when entering NEW lobbies
  // This effect only tracks lobby changes for debugging purposes
  useEffect(() => {
    prevLobbyIdRef.current = lobbyId
  }, [lobbyId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  return (
    <div className="flex flex-col">
      {/* Chat Messages - Viewport-relative max height with internal scroll */}
      <div className="max-h-[70vh] overflow-y-auto space-y-2 mb-3 custom-scrollbar">
        {chatMessages.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">
            No messages yet. Say hi!
          </p>
        ) : (
          chatMessages.map((msg, i) => (
            <div 
              key={i}
              className={`text-sm ${
                msg.type === 'system' 
                  ? 'text-center text-text-muted italic py-1' 
                  : 'bg-white/5 rounded-lg p-2'
              }`}
            >
              {msg.type === 'chat' && (
                <span 
                  className="font-orbitron text-xs font-semibold"
                  style={{ color: getUserColor(msg.username) }}
                >
                  {msg.username}:{' '}
                </span>
              )}
              <span className={msg.type === 'chat' ? 'text-white' : ''}>
                {msg.message}
              </span>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Chat Input - Fixed at bottom */}
      <form onSubmit={handleSendMessage} className="flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-primary/50"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className="p-2 bg-accent-primary/20 hover:bg-accent-primary/30 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <Send className="w-5 h-5 text-accent-primary" />
        </button>
      </form>
    </div>
  )
}

const RightSidebar = ({ className = '' }) => {
  const activeTab = useSelector(selectActiveTab)
  const location = useLocation()
  const isInLobby = location.pathname.startsWith('/lobby') || location.pathname.startsWith('/battle')

  const getPanelContent = () => {
    // Show lobby chat if in lobby or battle
    if (isInLobby) {
      return <LobbyChatPanel />
    }

    switch (activeTab) {
      case 'play':
        return <GameInitPanel />
      case 'multiplayer':
        return <MultiplayerPanel />
      case 'settings':
        return <SettingsPanel />
      case 'history':
        return <HistoryPanel />
      case 'home':
      case 'stats':
      default:
        return <LeaderboardPanel />
    }
  }

  const getPanelTitle = () => {
    // Show chat title if in lobby
    if (isInLobby) {
      return { icon: MessageCircle, text: 'LOBBY CHAT' }
    }

    switch (activeTab) {
      case 'play':
        return { icon: Zap, text: 'GAME SETUP' }
      case 'multiplayer':
        return { icon: Users, text: 'MULTIPLAYER' }
      case 'settings':
        return { icon: Settings, text: 'SETTINGS' }
      case 'history':
        return { icon: History, text: 'HISTORY' }
      default:
        return { icon: Trophy, text: 'LEADERBOARD' }
    }
  }

  const { icon: Icon, text } = getPanelTitle()

  const getPanelKey = () => {
    if (isInLobby) return 'lobby-chat'
    
    switch (activeTab) {
      case 'play': return 'play'
      case 'multiplayer': return 'multiplayer'
      case 'settings': return 'settings'
      case 'history': return 'history'
      default: return 'leaderboard'
    }
  }

  return (
    <aside className={`flex flex-col h-full bg-bg-card/80 backdrop-blur-md border-l border-white/10 ${className}`}>
      <div className="p-6 border-b border-white/10">
        <h2 className="font-arcade text-lg text-text-highlight flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {text}
        </h2>
      </div>

      <div className={`flex-1 p-6 min-h-0 ${isInLobby ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'} custom-scrollbar`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={getPanelKey()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={isInLobby ? 'flex-1 flex flex-col min-h-0 overflow-hidden' : ''}
          >
            {getPanelContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  )
}

export default RightSidebar
