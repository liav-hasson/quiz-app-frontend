import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * RetroInput - A styled input component matching the quiz app's retro/neon aesthetic
 * Supports text and password types with visibility toggle
 */
const RetroInput = ({ 
  value, 
  onChange, 
  placeholder = '', 
  type = 'text',
  disabled = false,
  className = '',
  showVisibilityToggle = false,
  autoComplete = 'off',
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className="relative">
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none transition-all font-arcade text-[10px] placeholder:text-white/30 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'shadow-[0_0_10px_rgba(217,70,239,0.2)] hover:shadow-[0_0_15px_rgba(217,70,239,0.4)] hover:border-purple-500 focus:border-accent-primary focus:shadow-[0_0_20px_rgba(217,70,239,0.5)]'
        } ${showVisibilityToggle && type === 'password' ? 'pr-10' : ''} ${className}`}
      />
      {showVisibilityToggle && type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  )
}

export default RetroInput
