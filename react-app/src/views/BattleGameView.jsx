import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  ArrowLeft, 
  Clock, 
  Users,
  Crown,
  Zap,
  Star,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { selectUser } from '../store/slices/authSlice'
import { fetchUserProfile, selectUserProfile } from '../store/slices/quizSlice'
import { leaveLobby as leaveLobbyAction } from '../store/slices/lobbySlice'
import socketService from '../api/socketService'
import { useLobbyChatContext } from '../contexts/LobbyChatContext'
import MarkdownRenderer from '../components/common/MarkdownRenderer'

// Game States
const GAME_STATE = {
  LOADING: 'loading',
  COUNTDOWN: 'countdown',
  QUESTION: 'question',
  EVALUATING: 'evaluating',
  RESULTS: 'results',
  GAME_OVER: 'game_over'
}

const BattleGameView = () => {
  const { lobbyId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const currentUser = useSelector(selectUser)
  const userProfile = useSelector(selectUserProfile)
  const token = currentUser?.token
  const { setChatMessages, setLobbyId } = useLobbyChatContext()
  
  // Initial game data from navigation state (if available)
  const initialGameData = location.state?.gameData
  
  // Game state
  const [gameState, setGameState] = useState(initialGameData ? GAME_STATE.QUESTION : GAME_STATE.LOADING)
  const [countdown, setCountdown] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(initialGameData?.total_questions || 10)
  const [timeLeft, setTimeLeft] = useState(30)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [hasAnswered, setHasAnswered] = useState(false)
  const [answerFeedback, setAnswerFeedback] = useState(null)
  const [calculatedScore, setCalculatedScore] = useState(null)
  
  // Standings
  const [standings, setStandings] = useState([])
  const [finalResults, setFinalResults] = useState(null)
  
  // Timer ref
  const timerRef = useRef(null)
  
  // XP Animation state for game over screen
  const [xpProgress, setXpProgress] = useState(0)
  const [isLevelingUp, setIsLevelingUp] = useState(false)
  const [displayLevel, setDisplayLevel] = useState(1)

  // Level calculation: 100 XP per level
  const calculateLevel = (xp) => {
    if (!xp) return { level: 1, nextLevelXP: 100, progress: 0, xpIntoLevel: 0 }
    const level = Math.floor(xp / 100) + 1
    const xpIntoLevel = xp % 100
    const progress = xpIntoLevel
    return { level, nextLevelXP: level * 100, progress, xpIntoLevel }
  }

  // Set lobby ID in context
  useEffect(() => {
    if (lobbyId) setLobbyId(lobbyId)
  }, [lobbyId, setLobbyId])

  // XP animation when game ends
  useEffect(() => {
    if (gameState !== GAME_STATE.GAME_OVER || !finalResults) return
    
    const myResult = standings.find(p => p.user_id === currentUser?.id)
    const earnedXP = myResult?.xp_earned || finalResults.xp_awarded?.[currentUser?.id] || 0
    const previousXP = userProfile?.XP || 0
    const newTotalXP = previousXP + earnedXP
    
    const prevLevelData = calculateLevel(previousXP)
    const newLevelData = calculateLevel(newTotalXP)
    
    setDisplayLevel(prevLevelData.level)
    setXpProgress(prevLevelData.progress)
    
    // Animate XP bar after short delay
    const animationTimer = setTimeout(() => {
      if (newLevelData.level > prevLevelData.level) {
        // Level up! Animate to 100%, then flash and reset
        setIsLevelingUp(true)
        setXpProgress(100)
        
        setTimeout(() => {
          setDisplayLevel(newLevelData.level)
          setXpProgress(0)
          setTimeout(() => {
            setXpProgress(newLevelData.progress)
            setIsLevelingUp(false)
          }, 300)
        }, 1200)
      } else {
        // Normal XP gain
        setXpProgress(newLevelData.progress)
      }
    }, 800)
    
    return () => clearTimeout(animationTimer)
  }, [gameState, finalResults, standings, currentUser?.id, userProfile?.XP])

  // Connect to socket and listen for game events
  useEffect(() => {
    if (!lobbyId || !token) return

    let unsubscribe = null

    const setupSocket = async () => {
      try {
        await socketService.initSocket()
        await socketService.joinRoom(lobbyId)

        // Subscribe to all game events using the unified handler
        unsubscribe = socketService.subscribeLobbyEvents({
          onCountdownStarted: (data) => {
            console.log('Countdown started:', data)
            setGameState(GAME_STATE.COUNTDOWN)
            setCountdown(data.seconds)
            // Initialize standings from players list if provided by server
            if (data.players && data.players.length > 0) {
              const initialStandings = data.players.map(p => ({
                user_id: p.user_id || p._id,
                username: p.username,
                score: 0,
                correct_answers: 0
              }))
              setStandings(initialStandings)
            }
          },
          onGameStarted: (data) => {
            console.log('Game started:', data)
            setGameState(GAME_STATE.QUESTION)
            setTotalQuestions(data.total_questions || 10)
            // Initialize standings from players list if provided by server
            if (data.players && data.players.length > 0) {
              const initialStandings = data.players.map(p => ({
                user_id: p.user_id || p._id,
                username: p.username,
                score: 0
              }))
              setStandings(initialStandings)
            }
          },
          onQuestionStarted: (data) => {
            console.log('Question started:', data)
            setCurrentQuestion(data)  // data IS the question object with all properties
            setQuestionNumber(data.question_number)
            setTimeLeft(data.time_limit)  // No fallback - backend must send this
            setQuestionStartTime(Date.now())
            setUserAnswer('')
            setHasAnswered(false)
            setAnswerFeedback(null)
            setCalculatedScore(null)
            setGameState(GAME_STATE.QUESTION)
          },
          onPlayerAnswered: (data) => {
            console.log('Player answered:', data)
            // Note: We don't update answerFeedback here because the local submitGameAnswer
            // already sets it with more detailed info (correctAnswer, userAnswer)
            // This event is mainly for other players to know someone answered
          },
          onQuestionEnded: (data) => {
            console.log('Question ended:', data)
            setGameState(GAME_STATE.RESULTS)
            setStandings(data.standings || [])
            // Update currentQuestion with correct_answer for feedback display
            if (data.correct_answer) {
              setCurrentQuestion(prev => prev ? {...prev, correct_answer: data.correct_answer} : prev)
            }
          },
          onScoresUpdated: (data) => {
            console.log('Scores updated:', data)
            setStandings(data.standings || [])
          },
          onGameEnded: (data) => {
            console.log('Game ended:', data)
            setGameState(GAME_STATE.GAME_OVER)
            setFinalResults(data)
            setStandings(data.final_standings || [])
            // Refresh profile to get updated XP
            dispatch(fetchUserProfile())
          },
          onNewMessage: (data) => {
            setChatMessages(prev => {
              // Deduplicate
              const isDuplicate = prev.some(msg => 
                msg.type === 'chat' && 
                msg.username === data.username && 
                msg.message === data.message &&
                Math.abs((msg.timestamp || 0) - (data.timestamp || Date.now())) < 1000
              )
              if (isDuplicate) return prev
              
              return [...prev, {
                type: 'chat',
                username: data.username,
                message: data.message,
                timestamp: data.timestamp || Date.now()
              }]
            })
          },
          onPlayerLeft: (data) => {
            setChatMessages(prev => [...prev, {
              type: 'system',
              message: `${data.username || 'A player'} left the game`,
              timestamp: Date.now()
            }])
          }
        })

        // Also listen for errors on the socket directly
        const socket = socketService.getSocket()
        if (socket) {
          socket.on('error', (data) => {
            console.error('Socket error:', data)
          })
        }
      } catch (err) {
        console.error('Failed to setup socket:', err)
      }
    }

    setupSocket()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [lobbyId, token, dispatch, currentUser?.id, setChatMessages])

  // Handle timeout - submit empty answer when time runs out
  const handleTimeout = useCallback(async () => {
    if (hasAnswered) return
    
    setHasAnswered(true)
    // Stay in QUESTION state - the question_ended event will trigger RESULTS state
    
    // Calculate full elapsed time (the entire question timer)
    const timeTaken = currentQuestion?.time_limit || 30
    
    try {
      // Submit empty answer to server - will score 0 points
      const result = await socketService.submitGameAnswer(lobbyId, '', timeTaken)
      
      // Get the correct answer from server response
      const correctLetter = result.correct_answer
      const correctIndex = correctLetter ? ['A', 'B', 'C', 'D'].indexOf(correctLetter) : -1
      const correctText = correctIndex >= 0 && currentQuestion?.options ? currentQuestion.options[correctIndex] : null
      
      setCalculatedScore(0)
      setAnswerFeedback({
        correct: false,
        score: 0,
        feedback: correctText ? `⏱️ Time's up! The correct answer was ${correctLetter}: ${correctText}` : `⏱️ Time's up!`,
        correctAnswer: correctLetter,
        userAnswer: null
      })
    } catch (error) {
      console.error('Failed to submit timeout:', error)
      // On error, we don't have the correct answer, just show generic message
      setAnswerFeedback({
        correct: false,
        score: 0,
        feedback: "⏱️ Time's up!",
        correctAnswer: null,
        userAnswer: null
      })
    }
  }, [hasAnswered, lobbyId, currentQuestion])

  // Timer countdown for questions - continues even after answering
  useEffect(() => {
    if (gameState === GAME_STATE.QUESTION && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    }
    
    if (timeLeft === 0 && gameState === GAME_STATE.QUESTION && !hasAnswered) {
      // Auto-submit empty answer on timeout
      handleTimeout()
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [gameState, timeLeft, hasAnswered, handleTimeout])

  const handleLeaveGame = () => {
    // Leave the socket room
    socketService.leaveRoom(lobbyId)
    // Clear lobby state from Redux (user is leaving the game completely)
    dispatch(leaveLobbyAction())
    // Navigate home
    navigate('/')
  }

  const handlePlayAgain = () => {
    navigate(`/lobby/${lobbyId}`)
  }

  // Timer color based on time left
  const getTimerColor = () => {
    if (timeLeft <= 5) return 'text-red-500'
    if (timeLeft <= 10) return 'text-yellow-500'
    return 'text-green-500'
  }

  // Render loading state
  if (gameState === GAME_STATE.LOADING) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-16 h-16 text-accent-primary animate-spin mb-4" />
        <p className="font-orbitron text-text-secondary animate-pulse">LOADING BATTLE...</p>
      </div>
    )
  }

  // Render countdown
  if (gameState === GAME_STATE.COUNTDOWN) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <motion.div
          key={countdown}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="font-orbitron text-text-secondary text-xl mb-4">GAME STARTING IN</p>
          <span className="font-arcade text-9xl text-accent-primary drop-shadow-[0_0_30px_rgba(217,70,239,0.5)]">
            {countdown}
          </span>
          <p className="font-orbitron text-text-muted text-sm mt-8">Get ready to battle!</p>
        </motion.div>
      </div>
    )
  }

  // Render game over / final results with podium
  if (gameState === GAME_STATE.GAME_OVER && finalResults) {
    const winner = standings[0]
    const secondPlace = standings[1]
    const thirdPlace = standings[2]
    const myResult = standings.find(p => p.user_id === currentUser?.id)
    const myPosition = standings.findIndex(p => p.user_id === currentUser?.id) + 1
    const myXP = myResult?.xp_earned || finalResults.xp_awarded?.[currentUser?.id] || 0

    return (
      <div className="max-w-6xl mx-auto w-full space-y-8 pb-12">
        {/* Confetti effect for winner */}
        {myPosition === 1 && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -20, 
                  x: Math.random() * window.innerWidth,
                  opacity: 1,
                  rotate: 0
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  opacity: [1, 1, 0]
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: 'linear'
                }}
                className={`absolute w-3 h-3 ${
                  ['bg-yellow-400', 'bg-accent-primary', 'bg-accent-secondary', 'bg-green-400', 'bg-blue-400'][Math.floor(Math.random() * 5)]
                } rounded-full`}
              />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="text-center relative">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.6, duration: 1 }}
            className="relative inline-block"
          >
            <Trophy className="w-32 h-32 mx-auto text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,0.8)]" />
            {myPosition === 1 && (
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 2
                }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-3xl" />
              </motion.div>
            )}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-arcade text-5xl text-white mt-6"
          >
            {myPosition === 1 ? '🎉 VICTORY! 🎉' : 'GAME OVER'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-orbitron text-text-secondary text-xl mt-2"
          >
            {myPosition === 1 ? 'You are the champion!' : 
             myPosition <= 3 ? `You placed ${myPosition}${myPosition === 2 ? 'nd' : 'rd'}!` :
             `${winner?.username} wins!`}
          </motion.p>
        </div>

        {/* Top 3 Podium */}
        {standings.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-end justify-center gap-6 h-80"
          >
            {/* 2nd Place */}
            {secondPlace && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
                  className="mb-4 relative"
                >
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center border-4 border-gray-400 shadow-[0_0_30px_rgba(156,163,175,0.5)]">
                    <span className="font-arcade text-4xl text-white">2</span>
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Star className="w-8 h-8 text-gray-300 fill-gray-300" />
                  </div>
                </motion.div>
                <div className="text-center bg-bg-card/80 backdrop-blur-md border-2 border-gray-400 rounded-xl p-4 min-w-[180px]">
                  <div className="font-orbitron text-white text-lg truncate">{secondPlace.username}</div>
                  <div className="font-arcade text-2xl text-gray-300 mt-1">{secondPlace.score || 0}</div>
                  <div className="text-text-muted text-sm mt-1">{secondPlace.correct_answers || 0}/{totalQuestions} correct</div>
                  <div className="flex items-center justify-center gap-1 mt-2 text-accent-primary">
                    <Zap className="w-4 h-4" />
                    <span className="font-orbitron text-sm">+{secondPlace.xp_earned || 0} XP</span>
                  </div>
                </div>
                <div className="w-40 h-32 bg-gradient-to-t from-gray-500/20 to-gray-400/10 border-t-4 border-gray-400 mt-4 rounded-t-xl" />
              </motion.div>
            )}

            {/* 1st Place */}
            {winner && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, type: 'spring' }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="mb-4 relative"
                >
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.8)]">
                    <span className="font-arcade text-5xl text-white">1</span>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2"
                  >
                    <Crown className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                  </motion.div>
                  <div className="absolute -top-2 -right-2">
                    <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                  </div>
                </motion.div>
                <div className="text-center bg-bg-card/80 backdrop-blur-md border-4 border-yellow-400 rounded-xl p-6 min-w-[200px] shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                  <div className="font-arcade text-yellow-400 text-xs mb-1">CHAMPION</div>
                  <div className="font-orbitron text-white text-xl truncate">{winner.username}</div>
                  <div className="font-arcade text-3xl text-yellow-400 mt-2">{winner.score || 0}</div>
                  <div className="text-text-muted text-sm mt-1">{winner.correct_answers || 0}/{totalQuestions} correct</div>
                  <div className="flex items-center justify-center gap-1 mt-3 text-accent-primary bg-accent-primary/10 rounded-lg py-2">
                    <Zap className="w-5 h-5" />
                    <span className="font-orbitron text-lg font-bold">+{winner.xp_earned || 0} XP</span>
                  </div>
                </div>
                <div className="w-48 h-48 bg-gradient-to-t from-yellow-500/30 to-yellow-400/20 border-t-4 border-yellow-400 mt-4 rounded-t-xl shadow-[0_0_30px_rgba(250,204,21,0.2)]" />
              </motion.div>
            )}

            {/* 3rd Place */}
            {thirdPlace && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, type: 'spring' }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.4 }}
                  className="mb-4 relative"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center border-4 border-amber-600 shadow-[0_0_25px_rgba(217,119,6,0.5)]">
                    <span className="font-arcade text-3xl text-white">3</span>
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Star className="w-7 h-7 text-amber-600 fill-amber-600" />
                  </div>
                </motion.div>
                <div className="text-center bg-bg-card/80 backdrop-blur-md border-2 border-amber-600 rounded-xl p-4 min-w-[180px]">
                  <div className="font-orbitron text-white text-lg truncate">{thirdPlace.username}</div>
                  <div className="font-arcade text-2xl text-amber-600 mt-1">{thirdPlace.score || 0}</div>
                  <div className="text-text-muted text-sm mt-1">{thirdPlace.correct_answers || 0}/{totalQuestions} correct</div>
                  <div className="flex items-center justify-center gap-1 mt-2 text-accent-primary">
                    <Zap className="w-4 h-4" />
                    <span className="font-orbitron text-sm">+{thirdPlace.xp_earned || 0} XP</span>
                  </div>
                </div>
                <div className="w-36 h-24 bg-gradient-to-t from-amber-600/20 to-amber-500/10 border-t-4 border-amber-600 mt-4 rounded-t-xl" />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Full Leaderboard for 4+ players */}
        {standings.length > 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-bg-card/60 backdrop-blur-md border border-white/10 rounded-2xl p-6"
          >
            <h3 className="font-orbitron text-white text-lg mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent-primary" />
              FULL STANDINGS
            </h3>
            <div className="space-y-2">
              {standings.slice(3).map((player, index) => (
                <motion.div
                  key={player.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 + index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    player.user_id === currentUser?.id
                      ? 'bg-accent-primary/20 border-2 border-accent-primary/50'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-arcade text-xl text-text-secondary w-8">
                      #{index + 4}
                    </span>
                    <div>
                      <div className="font-orbitron text-white">
                        {player.username}
                        {player.user_id === currentUser?.id && ' (YOU)'}
                      </div>
                      <div className="text-xs text-text-muted">
                        {player.correct_answers || 0}/{totalQuestions} correct • +{player.xp_earned || 0} XP
                      </div>
                    </div>
                  </div>
                  <span className="font-arcade text-xl text-accent-primary">
                    {player.score || 0}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Your Performance Summary with XP Progress Bar */}
        {myResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4 }}
            className="bg-gradient-to-r from-accent-primary/20 via-accent-secondary/20 to-accent-primary/20 border-2 border-accent-primary/50 rounded-2xl p-6"
          >
            <h3 className="font-orbitron text-white text-lg mb-4 text-center">YOUR PERFORMANCE</h3>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-text-muted text-sm mb-1">Final Rank</div>
                <div className="font-arcade text-3xl text-accent-primary">#{myPosition}</div>
              </div>
              <div className="text-center">
                <div className="text-text-muted text-sm mb-1">Total Score</div>
                <div className="font-arcade text-3xl text-white">{myResult.score || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-text-muted text-sm mb-1">XP Earned</div>
                <motion.div 
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                  className="font-arcade text-3xl text-accent-primary flex items-center justify-center gap-2"
                >
                  <Zap className="w-6 h-6" />
                  +{myXP}
                </motion.div>
              </div>
            </div>
            
            {/* Level Progress Bar */}
            <div className="bg-bg-dark/50 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <motion.span 
                  animate={isLevelingUp ? { scale: [1, 1.3, 1], color: ['#d946ef', '#22c55e', '#d946ef'] } : {}}
                  transition={{ duration: 0.6 }}
                  className="font-arcade text-lg text-accent-primary"
                >
                  LVL {displayLevel}
                </motion.span>
                <span className="font-orbitron text-sm text-text-secondary">
                  {Math.round(xpProgress)} / 100 XP
                </span>
                <span className="font-arcade text-lg text-text-muted">
                  LVL {displayLevel + 1}
                </span>
              </div>
              <div className="h-4 bg-bg-dark rounded-full overflow-hidden border border-white/20">
                <motion.div 
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: isLevelingUp ? 1.2 : 0.8, ease: "easeOut" }}
                  className={`h-full relative overflow-hidden ${
                    isLevelingUp 
                      ? 'bg-gradient-to-r from-green-400 via-yellow-400 to-green-400' 
                      : 'bg-gradient-to-r from-accent-primary to-accent-secondary'
                  } shadow-[0_0_15px_rgba(217,70,239,0.6)]`}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  {/* Level up flash */}
                  {isLevelingUp && (
                    <motion.div
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.5, repeat: 2 }}
                      className="absolute inset-0 bg-white/50"
                    />
                  )}
                </motion.div>
              </div>
              {isLevelingUp && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-2 font-arcade text-green-400 text-lg"
                >
                  🎉 LEVEL UP! 🎉
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={handleLeaveGame}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-orbitron text-white transition-all border border-white/10"
          >
            BACK TO HOME
          </button>
          <button
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl font-arcade text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_40px_rgba(217,70,239,0.6)] transition-all"
          >
            PLAY AGAIN
          </button>
        </motion.div>
      </div>
    )
  }

  // Main game layout: Question center (full width, no sidebar)
  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="space-y-6">
        {/* Main Content - Question Area */}
        <div className="space-y-6">
          {/* Header with timer and progress */}
          <div className="bg-bg-card/60 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleLeaveGame}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-text-secondary" />
              </button>
              
              <div className="flex items-center gap-8">
                {/* Question Counter */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/20 border border-accent-primary/50 flex items-center justify-center">
                    <span className="font-arcade text-xl text-accent-primary">{questionNumber}</span>
                  </div>
                  <div className="font-orbitron text-sm">
                    <div className="text-text-muted">QUESTION</div>
                    <div className="text-white">{questionNumber} / {totalQuestions}</div>
                  </div>
                </div>
                
                {/* Timer */}
                <motion.div 
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 ${
                    timeLeft <= 5 ? 'border-red-500 bg-red-500/10' :
                    timeLeft <= 10 ? 'border-yellow-500 bg-yellow-500/10' :
                    'border-green-500 bg-green-500/10'
                  }`}
                  animate={timeLeft <= 5 ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <Clock className={`w-6 h-6 ${getTimerColor()}`} />
                  <span className={`font-arcade text-3xl ${getTimerColor()}`}>
                    {timeLeft}s
                  </span>
                </motion.div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  timeLeft <= 5 ? 'bg-red-500' :
                  timeLeft <= 10 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / (currentQuestion?.time_limit || 30)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Question Card - only show during QUESTION state */}
          <AnimatePresence mode="wait">
            {currentQuestion && gameState === GAME_STATE.QUESTION && (
              <motion.div
                key={questionNumber}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-[80px] pointer-events-none" />
                
                {/* Category Badge */}
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <span className="px-3 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary text-xs font-orbitron border border-accent-secondary/20">
                    {currentQuestion.category || 'General'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-orbitron ${
                    currentQuestion.difficulty === 3 ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                    currentQuestion.difficulty === 2 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                    'bg-green-500/20 text-green-400 border border-green-500/20'
                  }`}>
                    {currentQuestion.difficulty === 3 ? 'HARD' : currentQuestion.difficulty === 2 ? 'MEDIUM' : 'EASY'}
                  </span>
                </div>

                {/* Question Text with Markdown Support */}
                <div className="text-xl md:text-2xl text-white leading-relaxed font-sans mb-8">
                  <MarkdownRenderer content={currentQuestion.text || currentQuestion.question} />
                </div>

                {/* Difficulty Indicator Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                  <motion.div 
                    className="h-full bg-accent-primary"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / (currentQuestion.time_limit || 30)) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multiple Choice Options - Kahoot Style with Answer Highlighting */}
          {gameState === GAME_STATE.QUESTION && currentQuestion?.options && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {currentQuestion.options.map((option, index) => {
                const colors = [
                  { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', hover: 'hover:bg-red-500/30', shadow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]' },
                  { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', hover: 'hover:bg-blue-500/30', shadow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]' },
                  { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', hover: 'hover:bg-yellow-500/30', shadow: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]' },
                  { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', hover: 'hover:bg-green-500/30', shadow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]' }
                ]
                const color = colors[index]
                const label = ['A', 'B', 'C', 'D'][index]
                
                // Determine if this is the correct/wrong answer after user answered
                const isCorrectAnswer = answerFeedback?.correctAnswer === label
                const isUserWrongAnswer = answerFeedback?.userAnswer === label && !answerFeedback?.correct
                
                // Override colors if feedback received
                let buttonStyle = `${color.bg} ${color.border}`
                let textStyle = color.text
                if (answerFeedback) {
                  if (isCorrectAnswer) {
                    buttonStyle = 'bg-green-500/40 border-green-400 ring-2 ring-green-400'
                    textStyle = 'text-green-400'
                  } else if (isUserWrongAnswer) {
                    buttonStyle = 'bg-red-500/40 border-red-400'
                    textStyle = 'text-red-400'
                  } else {
                    buttonStyle = 'bg-white/5 border-white/20 opacity-50'
                    textStyle = 'text-text-muted'
                  }
                }
                
                return (
                  <motion.button
                    key={index}
                    whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                    whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                    disabled={hasAnswered}
                    onClick={() => {
                      if (hasAnswered) return
                      // Submit answer directly with the label
                      setUserAnswer(label)
                      setHasAnswered(true)
                      // Stay in QUESTION state - don't change to EVALUATING
                      // The question and options remain visible, timer continues
                      
                      // Calculate elapsed time
                      const elapsedTime = (Date.now() - questionStartTime) / 1000
                      
                      // Submit to server
                      socketService.submitGameAnswer(lobbyId, label, elapsedTime)
                        .then(result => {
                          console.log('Answer result from server:', result)
                          setCalculatedScore(result.points_earned)
                          // Get the correct answer from server response (now includes correct_answer)
                          const correctLetter = result.correct_answer
                          console.log('Correct letter:', correctLetter, 'Options:', currentQuestion?.options)
                          const correctIndex = correctLetter ? ['A', 'B', 'C', 'D'].indexOf(correctLetter) : -1
                          const correctText = correctIndex >= 0 && currentQuestion?.options ? currentQuestion.options[correctIndex] : null
                          console.log('Correct index:', correctIndex, 'Correct text:', correctText)
                          setAnswerFeedback({
                            correct: result.is_correct,
                            score: result.points_earned,
                            feedback: result.is_correct ? '' : (correctText ? `The correct answer was ${correctLetter}: ${correctText}` : 'Incorrect'),
                            correctAnswer: correctLetter,
                            userAnswer: label
                          })
                        })
                        .catch(error => {
                          console.error('Failed to submit answer:', error)
                          setAnswerFeedback({
                            correct: false,
                            score: 0,
                            feedback: 'Failed to submit answer'
                          })
                        })
                    }}
                    className={`${buttonStyle} border-2 rounded-2xl p-6 text-left transition-all duration-200 group relative overflow-hidden ${!hasAnswered ? color.hover + ' ' + color.shadow : 'cursor-default'} ${userAnswer === label && !answerFeedback ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}`}
                  >
                    {/* Background glow effect */}
                    {!hasAnswered && (
                      <div className={`absolute inset-0 ${color.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                    )}
                    
                    {/* Correct answer indicator */}
                    {answerFeedback && isCorrectAnswer && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </motion.div>
                    )}
                    
                    {/* Wrong answer indicator */}
                    {answerFeedback && isUserWrongAnswer && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <XCircle className="w-6 h-6 text-red-400" />
                      </motion.div>
                    )}
                    
                    <div className="relative z-10 flex items-center gap-4">
                      <span className={`font-arcade text-3xl ${answerFeedback ? textStyle : color.text} min-w-[40px]`}>
                        {label}
                      </span>
                      <span className={`font-sans text-lg flex-1 ${answerFeedback && !isCorrectAnswer && !isUserWrongAnswer ? 'text-text-muted' : 'text-white'}`}>
                        {option}
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </motion.div>
          )}

          {/* Answer Feedback with Score Animation - shows during QUESTION state after answering */}
          {gameState === GAME_STATE.QUESTION && answerFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-xl border relative overflow-hidden ${
                answerFeedback.correct
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-red-500/20 border-red-500/50'
              }`}
            >
              {/* Glow effect for correct answers */}
              {answerFeedback.correct && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [0, 2, 2] }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 bg-green-400/30 rounded-xl blur-2xl"
                />
              )}
              
              <div className="flex items-center gap-3 mb-3 relative z-10">
                {answerFeedback.correct ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400" />
                )}
                <span className={`font-arcade text-xl ${
                  answerFeedback.correct ? 'text-green-400' : 'text-red-400'
                }`}>
                  {answerFeedback.correct ? 'CORRECT!' : 'INCORRECT'}
                </span>
                
                {/* Animated Score Display */}
                {answerFeedback.correct && calculatedScore > 0 && (
                  <motion.span
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: [0, 1.3, 1], y: [20, -5, 0] }}
                    transition={{ duration: 0.6, times: [0, 0.6, 1] }}
                    className="ml-auto font-arcade text-3xl text-accent-primary drop-shadow-[0_0_20px_rgba(217,70,239,0.8)]"
                  >
                    +{calculatedScore}
                  </motion.span>
                )}
                {!answerFeedback.correct && (
                  <span className="ml-auto font-arcade text-xl text-gray-400">
                    +0
                  </span>
                )}
              </div>
              {answerFeedback.feedback && (
                <p className="text-text-secondary text-sm relative z-10">{answerFeedback.feedback}</p>
              )}
            </motion.div>
          )}

          {/* Question Results - Full Screen Leaderboard */}
          {gameState === GAME_STATE.RESULTS && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 pointer-events-none" />
              
              <div className="relative z-10">
                <h3 className="font-arcade text-2xl text-white mb-6 text-center flex items-center justify-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  CURRENT STANDINGS
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </h3>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {standings.map((player, index) => {
                    const isCurrentUser = player.user_id === currentUser?.id
                    return (
                      <motion.div
                        key={player.user_id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-accent-primary/30 to-accent-secondary/30 border-2 border-accent-primary shadow-[0_0_20px_rgba(217,70,239,0.4)]'
                            : index === 0
                              ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/50'
                              : index === 1
                                ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-2 border-gray-400/50'
                                : index === 2
                                  ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-2 border-amber-600/50'
                                  : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-arcade text-2xl ${
                            index === 0 ? 'bg-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 
                            index === 1 ? 'bg-gray-400/30 text-gray-300' : 
                            index === 2 ? 'bg-amber-600/30 text-amber-500' : 
                            'bg-white/10 text-text-secondary'
                          }`}>
                            {index === 0 ? <Crown className="w-6 h-6" /> : index + 1}
                          </div>
                          <div>
                            <div className="font-orbitron text-lg text-white">
                              {player.username}
                              {isCurrentUser && <span className="text-accent-primary ml-2 text-sm">(YOU)</span>}
                            </div>
                            <div className="text-sm text-text-muted">
                              {player.correct_answers || 0}/{questionNumber} correct
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <motion.span 
                            key={player.score}
                            initial={{ scale: 1.5, color: '#22c55e' }}
                            animate={{ scale: 1, color: '#d946ef' }}
                            transition={{ duration: 0.5 }}
                            className="font-arcade text-3xl text-accent-primary"
                          >
                            {player.score || 0}
                          </motion.span>
                          <div className="text-xs text-text-muted">points</div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="font-orbitron text-text-secondary text-center mt-6"
                >
                  Next question starting...
                </motion.p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BattleGameView
