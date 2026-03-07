import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, RefreshCw, ArrowRight, Zap, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

const FeedbackOverlay = ({ score, feedback, onNext, isLoading, difficulty = 2, question, autoShowPerfectAnswer = false }) => {
  const [perfectAnswer, setPerfectAnswer] = useState(null)
  const [isLoadingPerfect, setIsLoadingPerfect] = useState(false)
  const [perfectAnswerError, setPerfectAnswerError] = useState(null)
  const [showPerfectAnswer, setShowPerfectAnswer] = useState(false)
  const [autoTriggered, setAutoTriggered] = useState(false)
  // Determine color based on score (0-10)
  const isHigh = score >= 8
  const isMedium = score >= 5 && score < 8
  const colorClass = isHigh ? 'text-green-400' : isMedium ? 'text-yellow-400' : 'text-red-400'
  const bgClass = isHigh ? 'bg-green-500/20' : isMedium ? 'bg-yellow-500/20' : 'bg-red-500/20'
  const borderClass = isHigh ? 'border-green-500' : isMedium ? 'border-yellow-500' : 'border-red-500'
  
  // Calculate XP gained based on score and difficulty
  const numericScore = typeof score === 'string' && score.includes('/') ? parseFloat(score.split('/')[0]) : parseFloat(score)
  const difficultyMultiplier = difficulty === 1 ? 1 : difficulty === 2 ? 1.5 : 2
  const xpGained = Math.round(numericScore * difficultyMultiplier)

  // Auto-trigger perfect answer generation for "I'm Cooked"
  useEffect(() => {
    if (autoShowPerfectAnswer && !autoTriggered && !perfectAnswer && !isLoadingPerfect) {
      setAutoTriggered(true)
      // Trigger the fetch directly to avoid stale closure issues
      ;(async () => {
        setIsLoadingPerfect(true)
        setPerfectAnswerError(null)
        try {
          const getAIHeaders = () => {
            try {
              const settingsStr = localStorage.getItem('quiz_ai_settings')
              if (!settingsStr) return {}
              const s = JSON.parse(settingsStr)
              const headers = {}
              if (s.customApiKey) headers['X-OpenAI-API-Key'] = s.customApiKey
              if (s.selectedModel) headers['X-OpenAI-Model'] = s.selectedModel
              return headers
            } catch { return {} }
          }
          const response = await fetch('/api/quiz/perfect-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAIHeaders() },
            body: JSON.stringify({ question }),
          })
          if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error || 'Failed to generate perfect answer')
          }
          const data = await response.json()
          setPerfectAnswer(data.perfect_answer)
          setShowPerfectAnswer(true)
        } catch (err) {
          setPerfectAnswerError(err.message)
        } finally {
          setIsLoadingPerfect(false)
        }
      })()
    }
  }, [autoShowPerfectAnswer])

  const handleGeneratePerfectAnswer = async () => {
    if (perfectAnswer && showPerfectAnswer) {
      // Toggle collapse
      setShowPerfectAnswer(false)
      return
    }

    if (perfectAnswer) {
      // Already loaded, just expand
      setShowPerfectAnswer(true)
      return
    }

    // Fetch perfect answer
    setIsLoadingPerfect(true)
    setPerfectAnswerError(null)

    try {
      // Get custom AI settings from localStorage (same as other quiz API calls)
      const getAIHeaders = () => {
        try {
          const settingsStr = localStorage.getItem('quiz_ai_settings')
          if (!settingsStr) return {}
          const settings = JSON.parse(settingsStr)
          const headers = {}
          if (settings.customApiKey) headers['X-OpenAI-API-Key'] = settings.customApiKey
          if (settings.selectedModel) headers['X-OpenAI-Model'] = settings.selectedModel
          return headers
        } catch {
          return {}
        }
      }

      const response = await fetch('/api/quiz/perfect-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAIHeaders(),
        },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate perfect answer')
      }

      const data = await response.json()
      setPerfectAnswer(data.perfect_answer)
      setShowPerfectAnswer(true)
    } catch (err) {
      setPerfectAnswerError(err.message)
    } finally {
      setIsLoadingPerfect(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-8 bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${isHigh ? 'bg-green-500' : isMedium ? 'bg-yellow-500' : 'bg-red-500'}`} />
      
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Score Circle */}
        <div className={`
          w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${borderClass} ${bgClass}
          shadow-[0_0_20px_rgba(0,0,0,0.3)] shrink-0 animate-score-pop
        `}>
          <span className="text-xs font-orbitron text-text-secondary uppercase">Score</span>
          <span className={`text-1xl font-arcade ${colorClass}`}>
            {String(score).includes('/') ? score : `${score}/10`}
          </span>
        </div>

        {/* Feedback Text */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/20 border border-accent-primary/50"
            >
              <Zap className="w-4 h-4 text-accent-primary" />
              <span className="font-arcade text-sm text-accent-primary">+{xpGained} XP</span>
            </motion.div>
          </div>
          <h3 className="font-arcade text-lg text-white mb-2 flex items-center gap-2">
            AI FEEDBACK <Star className={`w-4 h-4 ${colorClass}`} />
          </h3>
          <p className="text-text-secondary font-sans leading-relaxed">
            {feedback}
          </p>

          {/* Perfect Answer Button */}
          {question && (
            <div className="mt-4">
              <button
                onClick={handleGeneratePerfectAnswer}
                disabled={isLoadingPerfect}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary/20 hover:bg-accent-primary/30 
                  border border-accent-primary/50 hover:border-accent-primary transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoadingPerfect ? (
                  <>
                    <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    <span className="font-arcade text-sm text-accent-primary">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-accent-primary group-hover:scale-110 transition-transform" />
                    <span className="font-arcade text-sm text-accent-primary">
                      {perfectAnswer ? (showPerfectAnswer ? 'Hide' : 'Show') : 'Show'} 10/10 Answer
                    </span>
                    {perfectAnswer && (
                      showPerfectAnswer ? 
                        <ChevronUp className="w-4 h-4 text-accent-primary" /> : 
                        <ChevronDown className="w-4 h-4 text-accent-primary" />
                    )}
                  </>
                )}
              </button>

              {/* Perfect Answer Display */}
              <AnimatePresence>
                {showPerfectAnswer && perfectAnswer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-green-400" />
                      <h4 className="font-arcade text-sm text-green-400">PERFECT ANSWER</h4>
                    </div>
                    <p className="text-text-secondary font-sans text-sm leading-relaxed">
                      {perfectAnswer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Display */}
              {perfectAnswerError && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 font-sans text-sm">
                    {perfectAnswerError}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-3 justify-end">
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all group"
        >
          <RefreshCw className="w-4 h-4 text-white group-hover:rotate-180 transition-transform duration-500" />
          <span className="font-arcade text-sm text-white">Try Again</span>
        </button>
      </div>
    </motion.div>
  )
}

export default FeedbackOverlay
