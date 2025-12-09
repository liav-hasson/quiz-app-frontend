import React from 'react'
import { motion } from 'framer-motion'
import { Star, RefreshCw, ArrowRight, Zap } from 'lucide-react'

const FeedbackOverlay = ({ score, feedback, onNext, isLoading, difficulty = 2 }) => {
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
        </div>
      </div>


    </motion.div>
  )
}

export default FeedbackOverlay
