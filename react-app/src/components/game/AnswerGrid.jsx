import React from 'react'
import { motion } from 'framer-motion'

const AnswerOption = ({ text, index, isSelected, isCorrect, isWrong, onClick, disabled }) => {
  const letters = ['A', 'B', 'C', 'D']
  
  let borderColor = 'border-white/10'
  let bgColor = 'bg-bg-card-light'
  let textColor = 'text-text-secondary'
  
  if (isSelected) {
    borderColor = 'border-accent-secondary'
    bgColor = 'bg-accent-secondary/10'
    textColor = 'text-white'
  }
  
  if (isCorrect) {
    borderColor = 'border-green-500'
    bgColor = 'bg-green-500/20'
    textColor = 'text-green-400'
  }
  
  if (isWrong) {
    borderColor = 'border-red-500'
    bgColor = 'bg-red-500/20'
    textColor = 'text-red-400'
  }

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-xl border-2 ${borderColor} ${bgColor} transition-all duration-200 flex items-center gap-4 group relative overflow-hidden`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-arcade text-sm border ${
        isSelected || isCorrect || isWrong ? 'border-current' : 'border-white/20 bg-white/5'
      } ${textColor}`}>
        {letters[index]}
      </div>
      <span className={`flex-1 text-left font-orbitron text-sm ${isSelected || isCorrect || isWrong ? 'text-white' : 'text-text-primary'}`}>
        {text}
      </span>
      
      {/* Hover Glow */}
      {!disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
      )}
    </motion.button>
  )
}

const AnswerGrid = ({ options, selectedAnswer, correctAnswer, onSelect }) => {
  const letters = ['A', 'B', 'C', 'D']
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {options.map((option, index) => {
        const isSelected = selectedAnswer === option
        // If correctAnswer is a letter, compare with the letter of this option
        const optionLetter = letters[index]
        const isCorrect = correctAnswer === optionLetter || correctAnswer === option
        const isWrong = isSelected && correctAnswer && !(correctAnswer === optionLetter || correctAnswer === option)
        
        // If we are showing results (correctAnswer is set), disable clicking
        const disabled = !!correctAnswer

        return (
          <AnswerOption
            key={index}
            index={index}
            text={option}
            isSelected={isSelected}
            isCorrect={isCorrect}
            isWrong={isWrong}
            onClick={() => onSelect(option)}
            disabled={disabled}
          />
        )
      })}
    </div>
  )
}

export default AnswerGrid
