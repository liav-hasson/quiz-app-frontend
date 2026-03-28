import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Clock, Target, Hash, Plus, Users, Trophy, BookOpen, LogOut, Github, History, Settings, CircleAlert, MessageCircle, Send, ExternalLink, Key, Bot, CheckCircle, Loader2, AlertCircle, Shuffle, ChevronDown, ChevronUp, Shield, Info, UserCog, Trash2, Eye, EyeOff, Dices, Check, X, Edit3 } from 'lucide-react'
import { selectActiveTab, setActiveTab, selectAnimatedBackground, toggleAnimatedBackground, setSelectedHistoryItem, setSelectedDeepDiveArticle } from '../../store/slices/uiSlice'
import { selectCustomApiKey, selectSelectedModel, setCustomApiKey, setSelectedModel, clearCustomApiKey } from '../../store/slices/settingsSlice'
import { selectUser, selectAuthType, logout, loginSuccess } from '../../store/slices/authSlice'
import { REQUIRES_USER_API_KEY, ALLOW_GUEST_LOGIN, APP_VERSION } from '../../config.js'
import { getCategoriesWithSubjects, createLobby, joinLobby, getUserHistory, testAIConfiguration, getBackendVersion, changeUsername, changePassword, deleteAccount, getDeepDiveArchive } from '../../api/quizAPI'
import { setGameSettings, selectRateLimitInfo, clearRateLimitInfo } from '../../store/slices/quizSlice'
import { checkPasswordStrength, generateStrongPassword } from '../../utils/passwordUtils'
import LeaderboardPanel from './LeaderboardPanel'
import RetroSelect from '../ui/RetroSelect'
import RetroInput from '../ui/RetroInput'
import CategorySectionGrid from '../ui/CategorySectionGrid'
import { CATEGORY_SECTIONS } from '../../constants/categoryGroups'
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
  const [expandedSection, setExpandedSection] = useState(null)
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

    let finalCategory = selectedCategory
    
    // If no category selected but a section is expanded, randomize from that section
    if (!finalCategory && expandedSection) {
      const section = CATEGORY_SECTIONS.find(s => s.id === expandedSection)
      if (section) {
        const sectionCategories = section.categories.filter(cat => 
          availableCategories.includes(cat)
        )
        if (sectionCategories.length > 0) {
          finalCategory = sectionCategories[Math.floor(Math.random() * sectionCategories.length)]
        }
      }
    }
    
    // If still no category, randomize from all available
    if (!finalCategory) {
      finalCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)]
    }
    
    // Get subjects for the category
    const categorySubjects = categories[finalCategory] || []
    if (categorySubjects.length === 0) return
    
    // Randomize subject if not selected or if the current subject doesn't belong to the chosen category
    const subjectBelongsToCategory = selectedSubject && categorySubjects.includes(selectedSubject)
    const finalSubject = subjectBelongsToCategory ? selectedSubject : categorySubjects[Math.floor(Math.random() * categorySubjects.length)]
    
    // Randomize difficulty if not selected (use current selection if set)
    const finalDifficulty = difficulty ? (difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3) : Math.floor(Math.random() * 3) + 1

    // Start game with final settings
    dispatch(setGameSettings({
      category: finalCategory,
      subject: finalSubject,
      difficulty: finalDifficulty
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
          onSectionChange={setExpandedSection}
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
  const animatedBackground = useSelector(selectAnimatedBackground)
  const customApiKey = useSelector(selectCustomApiKey)
  const selectedModel = useSelector(selectSelectedModel)
  const rateLimitInfo = useSelector(selectRateLimitInfo)
  
  // AI configuration test state
  const [testStatus, setTestStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('')
  const [backendVersions, setBackendVersions] = useState({ api: null, multiplayer: null })
  
  useEffect(() => {
    getBackendVersion().then(v => setBackendVersions(v)).catch(() => {})
  }, [])
  
  // Collapsible sections state — accordion behavior on hover
  const [expandedSections, setExpandedSections] = useState({
    display: false,
    ai: false,
    rateLimit: false,
    account: false,
    community: false
  })

  // Auto-expand AI config section when redirected to set API key
  useEffect(() => {
    if (!customApiKey && REQUIRES_USER_API_KEY) {
      setExpandedSections(prev => ({ ...prev, ai: true }))
    }
  }, [customApiKey])
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

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
    <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
      {/* API Key Prompt Banner - show when user must provide their own API key */}
      {!customApiKey && REQUIRES_USER_API_KEY && (
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

      {/* Display Settings Section */}
      <div className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
        <button
          onClick={() => toggleSection('display')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <h3 className="text-slate-400 font-orbitron text-sm tracking-wider uppercase">Display</h3>
          </div>
          {expandedSections.display ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {expandedSections.display && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4" />
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Configuration Section */}
      <div className={`border rounded-xl bg-white/5 overflow-hidden transition-colors ${!customApiKey && REQUIRES_USER_API_KEY ? 'border-amber-500/50' : 'border-white/10'}`}>
        <button
          onClick={() => toggleSection('ai')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-slate-400" />
            <h3 className="text-slate-400 font-orbitron text-sm tracking-wider uppercase">AI Configuration</h3>
          </div>
          {expandedSections.ai ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {expandedSections.ai && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-2 space-y-3">
                {/* Status indicator */}
                <div className={`p-3 rounded-lg flex items-center gap-3 ${
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
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-accent-secondary" />
                      <span className="font-orbitron text-xs">OpenAI API Key</span>
                      <div className="relative group/info">
                        <Info className="w-3.5 h-3.5 text-text-muted hover:text-accent-secondary cursor-help transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 p-2 rounded-lg bg-[#1a1a2e] border border-accent-secondary/30 text-xs text-accent-secondary/80 opacity-0 pointer-events-none group-hover/info:opacity-100 group-hover/info:pointer-events-auto transition-opacity z-50 shadow-lg">
                          <Shield className="w-3 h-3 text-accent-secondary inline mr-1" />
                          Your API key is stored locally in your browser and is never sent to QuizLabs servers.
                        </div>
                      </div>
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
                      ? 'Required: Enter your OpenAI API key'
                      : 'Optional: Use your own key for custom models'}
                  </p>
                </div>

                {/* Model Selection */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-accent-primary" />
                    <span className="font-orbitron text-xs">AI Model</span>
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
                  className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg font-orbitron text-xs transition-all ${
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rate Limiting Section - Only show in local mode */}
      {ALLOW_GUEST_LOGIN && (
        <div className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
          <button
            onClick={() => toggleSection('rateLimit')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <h3 className="text-slate-400 font-orbitron text-sm tracking-wider uppercase">Rate Limiting</h3>
            </div>
            {expandedSections.rateLimit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <AnimatePresence>
            {expandedSections.rateLimit && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-2 space-y-3">
                  <p className="text-xs text-text-muted mb-3">
                    Rate limits prevent excessive API usage. Configure in .env file.
                  </p>
                  
                  {/* Singleplayer Rate Limit */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent-primary" />
                        <span className="font-orbitron text-xs">Singleplayer</span>
                      </div>
                      {rateLimitInfo && (
                        <span className="text-xs text-red-400 font-arcade">LIMITED</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Questions:</span>
                      <span className="font-arcade text-white">10 per hour</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Evaluations:</span>
                      <span className="font-arcade text-white">10 per hour</span>
                    </div>
                    {rateLimitInfo && (
                      <div className="pt-2 mt-2 border-t border-white/10">
                        <p className="text-xs text-amber-400">
                          Reset in {Math.ceil((rateLimitInfo.resetTime * 1000 - Date.now()) / 60000)} minutes
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Multiplayer Rate Limit */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent-secondary" />
                        <span className="font-orbitron text-xs">Multiplayer</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Games:</span>
                      <span className="font-arcade text-white">10 per hour</span>
                    </div>
                  </div>

                  {/* Configuration Link */}
                  <a 
                    href="https://github.com/liav-hasson/quiz-app-mini/blob/main/RATE_LIMITING.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-accent-secondary hover:text-accent-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Configuration Guide
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Account Section */}
      <div className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
        <button
          onClick={() => toggleSection('account')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-slate-400" />
            <h3 className="text-slate-400 font-orbitron text-sm tracking-wider uppercase">Account</h3>
          </div>
          {expandedSections.account ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {expandedSections.account && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <AccountSettings handleLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Community Section */}
      <div className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
        <button
          onClick={() => toggleSection('community')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="text-slate-400 font-orbitron text-sm tracking-wider uppercase">Community</h3>
          </div>
          {expandedSections.community ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {expandedSections.community && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-2 space-y-2">
                <a 
                  href="https://github.com/liav-hasson" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Github className="w-4 h-4" />
                    <span className="font-orbitron text-sm">GitHub</span>
                  </div>
                  <span className="text-xs text-text-secondary group-hover:text-white">View Repo</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Version footer */}
      <div className="text-[15px] text-white/15 font-mono text-center pt-2 select-none leading-relaxed">
        Frontend {APP_VERSION}<br />
        {backendVersions.api ? `API ${backendVersions.api}` : ''}{backendVersions.multiplayer ? ` · MP ${backendVersions.multiplayer}` : ''}
      </div>
    </div>
  )
}

// ---- Account Settings Sub-component ----
const AccountSettings = ({ handleLogout }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const authType = useSelector(selectAuthType)

  // Username change
  const [newUsername, setNewUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [usernameMsg, setUsernameMsg] = useState('')

  // Password change (credentials only)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwStatus, setPwStatus] = useState(null)
  const [pwMsg, setPwMsg] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [copiedPw, setCopiedPw] = useState(false)

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deletePw, setDeletePw] = useState('')
  const [deleteStatus, setDeleteStatus] = useState(null)
  const [deleteMsg, setDeleteMsg] = useState('')

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) return
    setUsernameStatus('loading')
    try {
      await changeUsername(newUsername.trim())
      setUsernameStatus('success')
      setUsernameMsg('Username updated!')
      // Update localStorage user object
      const stored = JSON.parse(localStorage.getItem('quiz_user') || '{}')
      stored.username = newUsername.trim()
      stored.name = newUsername.trim()
      localStorage.setItem('quiz_user', JSON.stringify(stored))
      dispatch(loginSuccess(stored))
      setNewUsername('')
    } catch (err) {
      setUsernameStatus('error')
      setUsernameMsg(err.message)
    }
    setTimeout(() => { setUsernameStatus(null); setUsernameMsg('') }, 3000)
  }

  const handleChangePw = async () => {
    if (!currentPw || !newPw) return
    if (newPw !== confirmPw) { setPwStatus('error'); setPwMsg('Passwords do not match'); setTimeout(() => { setPwStatus(null); setPwMsg('') }, 3000); return }
    setPwStatus('loading')
    try {
      await changePassword(currentPw, newPw)
      setPwStatus('success')
      setPwMsg('Password updated!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      setPwStatus('error')
      setPwMsg(err.message)
    }
    setTimeout(() => { setPwStatus(null); setPwMsg('') }, 3000)
  }

  const handleGeneratePw = () => {
    const pw = generateStrongPassword(16)
    setNewPw(pw)
    setConfirmPw(pw)
    navigator.clipboard.writeText(pw).then(() => { setCopiedPw(true); setTimeout(() => setCopiedPw(false), 2000) }).catch(() => {})
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return
    setDeleteStatus('loading')
    try {
      await deleteAccount(authType === 'credentials' ? deletePw : undefined)
      setDeleteStatus('success')
      setDeleteMsg('Account deleted')
      setTimeout(() => { dispatch(logout()); navigate('/login') }, 500)
    } catch (err) {
      setDeleteStatus('error')
      setDeleteMsg(err.message)
      setTimeout(() => { setDeleteStatus(null); setDeleteMsg('') }, 3000)
    }
  }

  const pwStrength = checkPasswordStrength(newPw)

  const authBadge = authType === 'credentials'
    ? { label: 'Local Account', cls: 'bg-accent-primary/20 text-accent-primary border-accent-primary/40' }
    : authType === 'guest'
    ? { label: 'Guest', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/40' }
    : { label: 'Google', cls: 'bg-accent-secondary/20 text-accent-secondary border-accent-secondary/40' }

  return (
    <div className="p-4 pt-2 space-y-3">
      {/* Profile info */}
      <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-accent-primary" />
            <span className="font-orbitron text-xs">Profile</span>
          </div>
          <span className={`text-[10px] font-orbitron px-2 py-0.5 rounded-full border ${authBadge.cls}`}>{authBadge.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {user?.picture && <img src={user.picture} alt="" className="w-8 h-8 rounded-full border border-white/10" />}
          <div className="min-w-0">
            <p className="text-sm font-orbitron text-white truncate">{user?.username || user?.name}</p>
            <p className="text-[10px] text-white/30 truncate">Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'recently'}</p>
          </div>
        </div>
      </div>

      {/* Change Username */}
      <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-accent-secondary" />
          <span className="font-orbitron text-xs">Change Username</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChangeUsername()}
            placeholder={user?.username || 'New username'}
            maxLength={30}
            className="flex-1 min-w-0 bg-[#121212] border border-white/10 rounded-lg p-2 text-white text-xs font-orbitron placeholder:text-white/20 outline-none focus:border-accent-primary transition-all"
          />
          <button
            onClick={handleChangeUsername}
            disabled={!newUsername.trim() || usernameStatus === 'loading'}
            className="shrink-0 px-2.5 py-2 rounded-lg bg-accent-secondary/20 border border-accent-secondary/50 text-accent-secondary text-xs font-orbitron hover:bg-accent-secondary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {usernameStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
          </button>
        </div>
        <AnimatePresence>
          {usernameMsg && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`text-[10px] ${usernameStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>{usernameMsg}</motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Change Password (credentials accounts only) */}
      {authType === 'credentials' && (
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-accent-primary" />
            <span className="font-orbitron text-xs">Change Password</span>
          </div>
          <div className="relative">
            <input type={showCurrentPw ? 'text' : 'password'} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Current password" className="w-full bg-[#121212] border border-white/10 rounded-lg p-2 pr-9 text-white text-xs font-orbitron placeholder:text-white/20 outline-none focus:border-accent-primary transition-all" />
            <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60" tabIndex={-1}>{showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
          </div>
          <div className="relative">
            <input type={showNewPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" className="w-full bg-[#121212] border border-white/10 rounded-lg p-2 pr-9 text-white text-xs font-orbitron placeholder:text-white/20 outline-none focus:border-accent-primary transition-all" />
            <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60" tabIndex={-1}>{showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
          </div>

          {/* Strength bar */}
          {newPw && (
            <div className="space-y-1">
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.color} ${pwStrength.glow}`} style={{ width: `${(pwStrength.score / 5) * 100}%` }} />
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] font-orbitron text-white/40">{pwStrength.label}</span>
                <div className="flex gap-1">
                  {[{ key: 'length', tip: '8+' }, { key: 'uppercase', tip: 'A-Z' }, { key: 'lowercase', tip: 'a-z' }, { key: 'digit', tip: '0-9' }, { key: 'special', tip: '!@#' }].map(({ key, tip }) => (
                    <span key={key} title={tip} className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] border ${pwStrength.checks[key] ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-400' : 'border-white/10 bg-white/5 text-white/20'}`}>
                      {pwStrength.checks[key] ? <Check className="w-2 h-2" /> : <X className="w-2 h-2" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generate password button */}
          <button type="button" onClick={handleGeneratePw} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-accent-secondary/30 bg-accent-secondary/10 text-accent-secondary text-[10px] font-orbitron hover:bg-accent-secondary/20 transition-all">
            {copiedPw ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Dices className="w-3 h-3" /> Generate Strong Password</>}
          </button>

          <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm new password" className="w-full bg-[#121212] border border-white/10 rounded-lg p-2 text-white text-xs font-orbitron placeholder:text-white/20 outline-none focus:border-accent-primary transition-all" />

          {confirmPw && newPw !== confirmPw && (
            <p className="text-[10px] text-red-400 flex items-center gap-1"><X className="w-2.5 h-2.5" /> Passwords don't match</p>
          )}

          <button onClick={handleChangePw} disabled={!currentPw || !newPw || newPw !== confirmPw || pwStatus === 'loading'} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-accent-primary/20 border border-accent-primary/50 text-accent-primary text-xs font-orbitron hover:bg-accent-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {pwStatus === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
          </button>
          <AnimatePresence>
            {pwMsg && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`text-[10px] ${pwStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>{pwMsg}</motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Danger Zone */}
      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="font-orbitron text-xs text-red-400">Danger Zone</span>
        </div>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all group">
            <span className="font-orbitron text-xs">Delete Account</span>
            <Trash2 className="w-4 h-4 opacity-50 group-hover:opacity-100" />
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
            <p className="text-[10px] text-red-400/70">This will permanently delete your account and all quiz data. Type <strong className="text-red-400">DELETE</strong> to confirm.</p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder='Type "DELETE"'
              className="w-full bg-[#121212] border border-red-500/30 rounded-lg p-2 text-red-400 text-xs font-orbitron placeholder:text-red-400/20 outline-none focus:border-red-500 transition-all"
            />
            {authType === 'credentials' && (
              <input
                type="password"
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[#121212] border border-red-500/30 rounded-lg p-2 text-red-400 text-xs font-orbitron placeholder:text-red-400/20 outline-none focus:border-red-500 transition-all"
              />
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeletePw('') }} className="flex-1 py-2 rounded-lg border border-white/10 text-white/50 text-xs font-orbitron hover:bg-white/5 transition-all">Cancel</button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || (authType === 'credentials' && !deletePw) || deleteStatus === 'loading'}
                className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-orbitron hover:bg-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleteStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Confirm Delete'}
              </button>
            </div>
            <AnimatePresence>
              {deleteMsg && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`text-[10px] ${deleteStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>{deleteMsg}</motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all group"
      >
        <span className="font-orbitron text-sm">Logout</span>
        <LogOut className="w-4 h-4 opacity-50 group-hover:opacity-100" />
      </button>
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
            className="flex-1 min-w-0 bg-bg-card-light border border-white/10 rounded-lg p-3 text-text-primary focus:border-accent-secondary outline-none font-arcade text-sm tracking-widest uppercase placeholder:text-white/20"
          />
          <button 
            onClick={handleJoinLobby}
            disabled={!joinCode || isJoining}
            className="px-3 sm:px-4 flex-shrink-0 min-w-[60px] bg-accent-secondary/20 hover:bg-accent-secondary/30 border border-accent-secondary/50 rounded-lg text-accent-secondary text-sm font-arcade transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
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

const DeepDiveArchivePanel = () => {
  const dispatch = useDispatch()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadArticles = async (p = 1) => {
    const setLoadingState = p === 1 ? setLoading : setLoadingMore
    setLoadingState(true)
    try {
      const data = await getDeepDiveArchive(p, 10)
      if (data.ok !== false) {
        if (p === 1) {
          setArticles(data.articles || [])
        } else {
          setArticles(prev => [...prev, ...(data.articles || [])])
        }
        setPage(p)
        setHasMore(data.has_more || false)
      }
    } catch (err) {
      console.error('Failed to load archive:', err)
    } finally {
      setLoadingState(false)
    }
  }

  useEffect(() => {
    loadArticles(1)
  }, [])

  if (loading) {
    return <div className="text-center text-text-muted font-orbitron text-xs animate-pulse">LOADING ARCHIVE...</div>
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-4">
        <BookOpen className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <p className="text-text-muted font-orbitron text-xs">NO PAST ARTICLES YET</p>
        <p className="text-text-muted text-[10px] mt-1.5">Check back tomorrow!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {articles.map((a) => {
        const title = a.content?.match(/^##\s+(.+)/m)?.[1] || a.date
        return (
          <div
            key={a.date}
            onClick={() => dispatch(setSelectedDeepDiveArticle(a))}
            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-rose-500/5 hover:border-rose-500/30 transition-all cursor-pointer"
          >
            <span className="text-xs font-arcade text-rose-400 line-clamp-2 leading-relaxed">{title}</span>
            <span className="block text-[10px] text-text-muted font-orbitron mt-1.5">{a.date}</span>
          </div>
        )
      })}

      {hasMore && (
        <button
          onClick={() => loadArticles(page + 1)}
          disabled={loadingMore}
          className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:bg-white/10 font-orbitron text-[10px] transition-all flex items-center justify-center gap-2"
        >
          {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : 'LOAD MORE'}
        </button>
      )}
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
      case 'deep-dive':
        return <DeepDiveArchivePanel />
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
      case 'deep-dive':
        return { icon: BookOpen, text: 'PAST ARTICLES' }
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
      case 'deep-dive': return 'deep-dive'
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
