import React, { memo } from 'react'
import { motion } from 'framer-motion'

const QuestionCard = memo(function QuestionCard({ question, category, difficulty, currentQuestionIndex, totalQuestions }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 relative z-10">
        <span className="px-2 sm:px-3 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary text-[10px] sm:text-xs font-orbitron border border-accent-secondary/20">
          {category}
        </span>
      </div>

      {/* Question Text */}
      <h2 className="text-base sm:text-lg md:text-xl text-white leading-relaxed font-sans">
        {question}
      </h2>

      {/* Difficulty Indicator */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
        <div 
          className={`h-full ${
            difficulty === 'Hard' ? 'bg-red-500' : 
            difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: '100%' }}
        />
      </div>
    </motion.div>
  )
})

export default QuestionCard
