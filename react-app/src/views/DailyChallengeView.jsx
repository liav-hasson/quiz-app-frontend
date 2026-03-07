import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Send, Trophy, Star, Zap, Flame, CheckCircle } from 'lucide-react'
import { getDailyChallenge, submitDailyAnswer, getDailyLeaderboard } from '../api/quizAPI'

const DailyChallengeView = () => {
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { score, feedback, xp_reward }

  const [leaderboard, setLeaderboard] = useState([])
  const [streak, setStreak] = useState(null)

  const textareaRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getDailyChallenge()

        if (!data.ok) throw new Error(data.error || 'Failed to load daily challenge')

        setChallenge(data)
        if (data.streak) setStreak(data.streak)
        if (data.already_answered && data.user_answer) {
          setResult({
            score: data.user_answer.score,
            feedback: data.user_answer.feedback,
            xp_reward: data.xp_reward,
          })
        }

        const lb = await getDailyLeaderboard()
        if (lb.ok && lb.leaderboard) setLeaderboard(lb.leaderboard)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await submitDailyAnswer(answer)
      if (!res.ok) throw new Error(res.error || 'Failed to submit answer')

      setResult({ score: res.score, feedback: res.feedback, xp_reward: res.xp_reward })
      if (res.streak) setStreak({ current_streak: res.streak, active: true })

      // Notify sidebar to refresh streak
      window.dispatchEvent(new Event('daily-streak-updated'))

      // Refresh leaderboard
      const lb = await getDailyLeaderboard()
      if (lb.ok && lb.leaderboard) setLeaderboard(lb.leaderboard)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-accent-primary animate-spin mb-4" />
        <p className="font-orbitron text-text-secondary animate-pulse">LOADING DAILY CHALLENGE...</p>
      </div>
    )
  }

  if (error && !challenge) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="font-arcade text-xl text-white mb-2">SYSTEM ERROR</h2>
        <p className="text-text-secondary mb-6 max-w-md">{error}</p>
      </div>
    )
  }

  const numericScore = typeof result?.score === 'string' && result.score.includes('/')
    ? parseFloat(result.score.split('/')[0])
    : parseFloat(result?.score)

  const scoreColor = numericScore >= 8 ? 'text-green-400' : numericScore >= 5 ? 'text-yellow-400' : 'text-red-400'
  const scoreBorder = numericScore >= 8 ? 'border-green-500' : numericScore >= 5 ? 'border-yellow-500' : 'border-red-500'
  const scoreBg = numericScore >= 8 ? 'bg-green-500/20' : numericScore >= 5 ? 'bg-yellow-500/20' : 'bg-red-500/20'

  return (
    <div className="max-w-3xl mx-auto w-full pb-20 space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/50 mb-4"
        >
          <Flame className="w-5 h-5 text-amber-400" />
          <span className="font-arcade text-sm text-amber-400">DAILY CHALLENGE</span>
        </motion.div>
        <p className="text-text-muted text-sm font-orbitron">{challenge?.date}</p>
      </div>

      {/* Question Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        <h3 className="font-arcade text-sm text-amber-400 mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" /> QUESTION OF THE DAY
        </h3>
        <p className="text-white font-sans text-lg leading-relaxed">
          {challenge?.question}
        </p>
      </motion.div>

      {/* Answer Input (only if not answered yet) */}
      {!result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-amber-500 rounded-xl opacity-0 group-hover:opacity-50 blur transition duration-300" />
            <div className="relative bg-[#1a1a1a] backdrop-blur-md rounded-xl p-1 shadow-lg border border-white/10">
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={submitting}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full bg-[#1a1a1a] text-white p-4 rounded-lg outline-none resize-none font-sans text-base placeholder:text-gray-500 border-2 border-amber-500/30 focus:border-amber-500 focus:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="mt-2 text-sm text-red-400 font-orbitron">{error}</p>
          )}

          <div className="flex justify-end mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              className={`px-8 py-3 rounded-xl font-arcade text-sm flex items-center gap-2 transition-all ${
                !answer.trim()
                  ? 'bg-white/5 text-text-muted cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]'
              }`}
            >
              {submitting ? (
                <span className="animate-pulse">ANALYZING...</span>
              ) : (
                <>SUBMIT <Send className="w-4 h-4" /></>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${numericScore >= 8 ? 'bg-green-500' : numericScore >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${scoreBorder} ${scoreBg} shadow-[0_0_20px_rgba(0,0,0,0.3)] shrink-0`}>
                <span className="text-xs font-orbitron text-text-secondary uppercase">Score</span>
                <span className={`text-lg font-arcade ${scoreColor}`}>
                  {String(result.score).includes('/') ? result.score : `${result.score}/10`}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-arcade text-sm text-amber-400">+{result.xp_reward || 50} XP</span>
                  </motion.div>
                  <span className="text-xs font-orbitron text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Awarded
                  </span>
                </div>
                <h3 className="font-arcade text-lg text-white mb-2 flex items-center gap-2">
                  AI FEEDBACK <Star className={`w-4 h-4 ${scoreColor}`} />
                </h3>
                <p className="text-text-secondary font-sans leading-relaxed">{result.feedback}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-6"
      >
        <h3 className="font-arcade text-sm text-white mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> TODAY'S LEADERBOARD
        </h3>
        {leaderboard.length === 0 ? (
          <p className="text-center text-text-muted font-orbitron text-xs py-4">
            No one has answered yet — be the first!
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-arcade text-sm w-6 text-center ${
                    i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-text-muted'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-orbitron text-sm text-white">{entry.username}</span>
                </div>
                <span className={`font-arcade text-sm ${
                  entry.score >= 8 ? 'text-green-400' : entry.score >= 5 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {String(entry.score).includes('/') ? entry.score : `${entry.score}/10`}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default DailyChallengeView
