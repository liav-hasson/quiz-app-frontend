import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const RetroSelect = ({ value, onChange, options, placeholder, glowColor = 'accent-secondary', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div ref={selectRef} className="relative">
      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none transition-all font-arcade text-[10px] flex items-center justify-between ${
          disabled 
            ? 'opacity-50 cursor-not-allowed blur-[0.5px] shadow-none' 
            : 'shadow-[0_0_10px_rgba(217,70,239,0.2)] hover:shadow-[0_0_15px_rgba(217,70,239,0.4)] hover:border-purple-500'
        }`}
      >
        <span className={!value ? 'text-white/40' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3" />
        </motion.div>
      </button>

      {/* Dropdown Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-[#121212] border border-white/20 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2.5 font-arcade text-[10px] transition-all ${
                  option.value === value
                    ? 'bg-gradient-to-r from-accent-primary to-accent-tertiary text-white shadow-[inset_0_0_10px_rgba(217,70,239,0.5)]'
                    : 'text-text-primary hover:bg-white/10 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RetroSelect
