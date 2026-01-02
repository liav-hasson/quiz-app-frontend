import React, { memo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'

const AnswerInput = memo(function AnswerInput({ value, onChange, onSubmit, disabled, isSubmitting }) {
  const textareaRef = useRef(null)

  const resizeTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    resizeTextarea()
  }, [value])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="mt-4 sm:mt-6 md:mt-8 relative">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-cyan-500 rounded-xl opacity-0 group-hover:opacity-50 blur transition duration-300"></div>
        <div className="relative bg-[#1a1a1a] backdrop-blur-md rounded-xl p-1 shadow-lg border border-white/10">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              resizeTextarea()
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSubmitting}
            placeholder="Type your answer here..."
            style={{ height: 'auto' }}
            className="w-full min-h-[6rem] sm:min-h-[7rem] md:min-h-[8rem] bg-[#1a1a1a] text-white p-3 sm:p-4 rounded-lg outline-none resize-none overflow-hidden font-sans text-base sm:text-lg placeholder:text-gray-500 border-2 border-cyan-500/30 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
          />
        </div>
      </div>

      <div className="flex justify-end mt-3 sm:mt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSubmit}
          disabled={disabled || isSubmitting || !value.trim()}
          className={`
            px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-arcade text-xs sm:text-sm flex items-center gap-2 transition-all
            ${disabled || !value.trim() 
              ? 'bg-white/5 text-text-muted cursor-not-allowed' 
              : 'bg-gradient-to-r from-accent-secondary to-accent-primary text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'
            }
          `}
        >
          {isSubmitting ? (
            <span className="animate-pulse">ANALYZING...</span>
          ) : (
            <>
              SUBMIT <Send className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
})

export default AnswerInput
