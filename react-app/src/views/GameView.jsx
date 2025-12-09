import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QuestionCard from '../components/game/QuestionCard'
import AnswerInput from '../components/game/AnswerInput'
import FeedbackOverlay from '../components/game/FeedbackOverlay'
import { Loader2, AlertCircle } from 'lucide-react'

import { useSelector, useDispatch } from 'react-redux'
import { 
  selectSelectedCategory, 
  selectSelectedSubject, 
  selectSelectedDifficulty,
  submitAnswer,
  generateQuestion,
  selectCurrentQuestion
} from '../store/slices/quizSlice'
import { updateTaskProgress } from '../store/slices/tasksSlice'

const GameView = () => {
  const dispatch = useDispatch()
  const [gameState, setGameState] = useState('init') // init, loading, playing, evaluating, feedback, error
  const [userAnswer, setUserAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [error, setError] = useState(null)
  
  // Prevent double fetch in React StrictMode (saves AI tokens!)
  const fetchingRef = useRef(false)
  const lastFetchParamsRef = useRef(null)
  
  // Game Settings from Redux
  const category = useSelector(selectSelectedCategory) || 'DevOps'
  const subject = useSelector(selectSelectedSubject) || 'Kubernetes'
  const difficulty = useSelector(selectSelectedDifficulty) || 2
  const questionData = useSelector(selectCurrentQuestion)

  const fetchQuestion = async (isInitial = false) => {
    // Create a key for current params to detect if settings changed
    const paramsKey = `${category}-${subject}-${difficulty}`
    
    // Prevent duplicate fetches (StrictMode protection)
    if (isInitial && fetchingRef.current && lastFetchParamsRef.current === paramsKey) {
      console.log('⏭️ Skipping duplicate question fetch (StrictMode protection)')
      return
    }
    
    fetchingRef.current = true
    lastFetchParamsRef.current = paramsKey
    
    setGameState('loading')
    setError(null)
    try {
      const resultAction = await dispatch(generateQuestion({ category, subject, difficulty }))
      
      if (generateQuestion.rejected.match(resultAction)) {
        const payload = resultAction.payload
        // Check if it's a rate limit error
        if (payload?.isRateLimited) {
          const resetDate = new Date(payload.resetTime * 1000)
          const minutesLeft = Math.ceil((payload.resetTime * 1000 - Date.now()) / 60000)
          throw new Error(`Rate limit reached (${payload.limit} questions/hour). Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`)
        }
        throw new Error(payload?.message || payload || 'Failed to generate question')
      }
      
      setUserAnswer('')
      setEvaluation(null)
      setGameState('playing')
    } catch (err) {
      setError(err.message || 'Failed to generate question')
      setGameState('error')
    } finally {
      fetchingRef.current = false
    }
  }

  // Initial load
  useEffect(() => {
    fetchQuestion(true) // true = initial fetch, apply StrictMode protection
  }, [category, subject, difficulty])

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return

    setGameState('evaluating')
    try {
      // Use Redux thunk to submit answer and auto-refresh profile/history
      const resultAction = await dispatch(submitAnswer({
        question: questionData.question,
        answer: userAnswer,
        difficulty
      }))

      if (submitAnswer.rejected.match(resultAction)) {
        const payload = resultAction.payload
        // Check if it's a rate limit error
        if (payload?.isRateLimited) {
          const minutesLeft = Math.ceil((payload.resetTime * 1000 - Date.now()) / 60000)
          throw new Error(`Rate limit reached. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`)
        }
        throw new Error(payload?.message || payload || 'Failed to evaluate answer')
      }

      const result = resultAction.payload
      setEvaluation(result)
      setGameState('feedback')

      // Update daily tasks progress
      dispatch(updateTaskProgress({
        category,
        difficulty,
        score: result.score
      }))

    } catch (err) {
      setError(err.message || 'Failed to evaluate answer')
      setGameState('error')
    }
  }

  const handleNext = () => {
    fetchQuestion(false) // false = user-initiated, don't skip
  }

  if (gameState === 'loading' || gameState === 'init') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-accent-primary animate-spin mb-4" />
        <p className="font-orbitron text-text-secondary animate-pulse">GENERATING CHALLENGE...</p>
      </div>
    )
  }

  if (gameState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="font-arcade text-xl text-white mb-2">SYSTEM ERROR</h2>
        <p className="text-text-secondary mb-6 max-w-md">{error}</p>
        <button 
          onClick={() => fetchQuestion(false)}
          className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/80 rounded-xl text-white font-orbitron"
        >
          TRY AGAIN
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto w-full pb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={questionData?.id || 'question'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <QuestionCard 
            question={questionData?.question}
            category={category}
            difficulty={difficulty === 1 ? 'Easy' : difficulty === 2 ? 'Medium' : 'Hard'}
            currentQuestionIndex={0} // TODO: Track session progress
            totalQuestions={null}
          />
        </motion.div>
      </AnimatePresence>

      <AnswerInput 
        value={userAnswer}
        onChange={setUserAnswer}
        onSubmit={handleSubmit}
        disabled={gameState === 'feedback'}
        isSubmitting={gameState === 'evaluating'}
      />

      <AnimatePresence>
        {gameState === 'feedback' && evaluation && (
          <FeedbackOverlay 
            score={evaluation.score}
            feedback={evaluation.feedback}
            onNext={handleNext}
            isLoading={false}
            difficulty={difficulty}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default GameView
