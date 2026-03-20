import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { loginSuccess } from '../store/slices/authSlice'
import { loginUser, guestLoginUser, credentialRegister, credentialLogin } from '../api/quizAPI'
import { GOOGLE_CLIENT_ID, ALLOW_GUEST_LOGIN, APP_VERSION } from '../config.js'
import { getBackendVersion } from '../api/quizAPI'
import { Loader2, AlertCircle, Eye, EyeOff, Dices, Check, X, Copy, CheckCircle } from 'lucide-react'
import { selectAnimatedBackground } from '../store/slices/uiSlice'
import PsychedelicSpiral from '../components/ui/PsychedelicSpiral'
import { checkPasswordStrength, generateStrongPassword } from '../utils/passwordUtils'

// Reusable neon input component for the login page
const NeonInput = ({ value, onChange, placeholder, type = 'text', disabled, maxLength, onKeyDown, autoComplete, showToggle }) => {
  const [visible, setVisible] = useState(false)
  const effectiveType = type === 'password' && visible ? 'text' : type
  return (
    <div className="relative">
      <input
        type={effectiveType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full p-3 bg-[#121212] border border-white/10 rounded-lg text-white text-sm font-orbitron placeholder:text-white/25 outline-none transition-all shadow-[0_0_10px_rgba(217,70,239,0.15)] hover:shadow-[0_0_15px_rgba(217,70,239,0.3)] focus:border-accent-primary focus:shadow-[0_0_20px_rgba(217,70,239,0.4)] disabled:opacity-50 disabled:cursor-not-allowed pr-10"
      />
      {showToggle && type === 'password' && (
        <button type="button" onClick={() => setVisible(!visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors" tabIndex={-1}>
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}

// Password strength bar
const PasswordStrengthBar = ({ password }) => {
  if (!password) return null
  const { score, label, color, glow, checks } = checkPasswordStrength(password)
  const pct = (score / 5) * 100

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color} ${glow}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-orbitron text-white/50">{label}</span>
        <div className="flex gap-1.5">
          {[
            { key: 'length', tip: '8+ chars' },
            { key: 'uppercase', tip: 'A-Z' },
            { key: 'lowercase', tip: 'a-z' },
            { key: 'digit', tip: '0-9' },
            { key: 'special', tip: '!@#' },
          ].map(({ key, tip }) => (
            <span key={key} title={tip} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${checks[key] ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-400' : 'border-white/10 bg-white/5 text-white/20'}`}>
              {checks[key] ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

const LoginView = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const animatedBackground = useSelector(selectAnimatedBackground)
  const [backendVersions, setBackendVersions] = useState({ api: null, multiplayer: null })

  // Tabs: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('login')

  // Login fields
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  // Signup fields
  const [signupUsername, setSignupUsername] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [copiedPassword, setCopiedPassword] = useState(false)

  // Guest (local dev only)
  const [guestUsername, setGuestUsername] = useState('')
  const isLocalEnv = ALLOW_GUEST_LOGIN

  useEffect(() => {
    getBackendVersion().then(v => setBackendVersions(v)).catch(() => {})
  }, [])

  // Clear error when switching tabs
  useEffect(() => { setError(null) }, [activeTab])

  // ----- Helpers -----
  const persistAndNavigate = useCallback((data) => {
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('quiz_user', JSON.stringify(data))
    // Always keep in localStorage for the Redux hydrator
    localStorage.setItem('quiz_user', JSON.stringify(data))
    dispatch(loginSuccess(data))
    navigate('/')
  }, [dispatch, navigate, rememberMe])

  // ----- Google handler -----
  const handleGoogleResponse = async (response) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await loginUser({ token: response.credential })
      if (data.error) throw new Error(data.error)
      if (!data.token) throw new Error('Invalid login response from server')
      persistAndNavigate(data)
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isLocalEnv) return undefined

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
          console.warn('Google Client ID not configured')
          return true
        }
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false
          })
          const btn = document.getElementById('google-signin-btn')
          if (btn) {
            window.google.accounts.id.renderButton(btn, { theme: 'filled_black', size: 'large', width: 250, text: 'continue_with' })
            setIsGoogleLoaded(true)
            return true
          }
        } catch (err) {
          console.error('Google Sign-In initialization failed:', err)
          return true
        }
      }
      return false
    }

    if (!initializeGoogle()) {
      const interval = setInterval(() => { if (initializeGoogle()) clearInterval(interval) }, 100)
      return () => clearInterval(interval)
    }
  }, [isLocalEnv])

  // ----- Credential handlers -----
  const handleCredentialLogin = async () => {
    if (!loginUsername.trim() || !loginPassword) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await credentialLogin({ username: loginUsername.trim(), password: loginPassword })
      persistAndNavigate(data)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialRegister = async () => {
    if (!signupUsername.trim() || !signupPassword) return
    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await credentialRegister({ username: signupUsername.trim(), password: signupPassword })
      persistAndNavigate(data)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePassword = () => {
    const pw = generateStrongPassword(16)
    setSignupPassword(pw)
    setSignupConfirm(pw)
    navigator.clipboard.writeText(pw).then(() => {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }).catch(() => {})
  }

  // ----- Guest handler (local only) -----
  const handleGuestLogin = async () => {
    if (!isLocalEnv || !guestUsername.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await guestLoginUser({ username: guestUsername.trim() })
      persistAndNavigate(data)
    } catch (err) {
      setError(err.message || 'Guest login failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Tab styling
  const tabClass = (tab) =>
    `flex-1 py-2.5 text-xs font-orbitron tracking-wider uppercase transition-all rounded-lg ${
      activeTab === tab
        ? 'bg-gradient-to-r from-accent-primary/30 to-accent-tertiary/30 text-white border border-accent-primary/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]'
        : 'text-white/40 hover:text-white/60 border border-transparent'
    }`

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      {animatedBackground ? (
        <PsychedelicSpiral className="absolute inset-0 pointer-events-none" spinRotation={-0.3} spinSpeed={1.5} color1="#050505" color2="#0f0f0f" color3="#1a1a1a" contrast={2.5} lighting={0.4} spinAmount={0.2} pixelFilter={500} isRotate={true} />
      ) : (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-accent-primary/10 rounded-full blur-[150px] animate-float" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-accent-secondary/10 rounded-full blur-[150px] animate-float" style={{ animationDelay: '-8s' }} />
          <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-[0.05]" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-bg-card/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-auto"
      >
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="font-arcade text-4xl tracking-tighter flex justify-center mb-3">
            {"QuizLabs".split('').map((char, index) => (
              <span key={index} className="animate-neon-cycle hover:animate-none hover:text-white transition-colors" style={{ animationDelay: `${index * 0.2}s` }}>{char}</span>
            ))}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setActiveTab('login')} className={tabClass('login')}>Log In</button>
          <button onClick={() => setActiveTab('signup')} className={tabClass('signup')}>Sign Up</button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* =================== LOGIN TAB =================== */}
          {activeTab === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
              <NeonInput value={loginUsername} onChange={setLoginUsername} placeholder="Username" disabled={isLoading} autoComplete="username" onKeyDown={(e) => e.key === 'Enter' && handleCredentialLogin()} />
              <NeonInput value={loginPassword} onChange={setLoginPassword} placeholder="Password" type="password" showToggle disabled={isLoading} autoComplete="current-password" onKeyDown={(e) => e.key === 'Enter' && handleCredentialLogin()} />

              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button type="button" onClick={() => setRememberMe(!rememberMe)} className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${rememberMe ? 'bg-accent-primary border-accent-primary' : 'border-white/20 bg-transparent'}`}>
                  {rememberMe && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-xs text-white/50 font-orbitron">Remember me</span>
              </label>

              <button
                onClick={handleCredentialLogin}
                disabled={!loginUsername.trim() || !loginPassword || isLoading}
                className="w-full py-3 rounded-lg font-orbitron text-sm font-bold tracking-wider bg-gradient-to-r from-accent-primary to-accent-tertiary text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'LOG IN'}
              </button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-bg-card px-3 text-white/25 font-orbitron">or</span></div>
              </div>

              {/* Google Sign-In */}
              {!isLocalEnv && (
                <div className="flex justify-center">
                  <div className="h-[40px] w-full relative">
                    {isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>
                    ) : (
                      <div id="google-signin-btn" className="w-full flex justify-center" />
                    )}
                  </div>
                </div>
              )}

              {/* Guest login (dev only) */}
              {isLocalEnv && (
                <div className="space-y-3">
                  <NeonInput value={guestUsername} onChange={setGuestUsername} placeholder="Guest username" maxLength={30} disabled={isLoading} onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()} />
                  <button onClick={handleGuestLogin} disabled={!guestUsername.trim() || isLoading} className="w-full py-2.5 bg-accent-secondary/20 border border-accent-secondary/50 text-accent-secondary rounded-lg font-orbitron text-xs hover:bg-accent-secondary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    Continue as Guest
                  </button>
                </div>
              )}

              <p className="text-center text-xs text-white/30 font-orbitron">
                Don't have an account?{' '}
                <button onClick={() => setActiveTab('signup')} className="text-accent-primary hover:text-accent-primary/80 transition-colors">Sign Up</button>
              </p>
            </motion.div>
          )}

          {/* =================== SIGNUP TAB =================== */}
          {activeTab === 'signup' && (
            <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
              <NeonInput value={signupUsername} onChange={setSignupUsername} placeholder="Choose a username" maxLength={30} disabled={isLoading} autoComplete="username" onKeyDown={(e) => e.key === 'Enter' && handleCredentialRegister()} />
              <NeonInput value={signupPassword} onChange={setSignupPassword} placeholder="Create a password" type="password" showToggle disabled={isLoading} autoComplete="new-password" />

              <PasswordStrengthBar password={signupPassword} />

              {/* Generate password button */}
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-accent-secondary/40 bg-accent-secondary/10 text-accent-secondary text-xs font-orbitron hover:bg-accent-secondary/20 transition-all"
              >
                {copiedPassword ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> Copied to clipboard!</>
                ) : (
                  <><Dices className="w-3.5 h-3.5" /> Generate Strong Password</>
                )}
              </button>

              <NeonInput value={signupConfirm} onChange={setSignupConfirm} placeholder="Confirm password" type="password" showToggle disabled={isLoading} autoComplete="new-password" onKeyDown={(e) => e.key === 'Enter' && handleCredentialRegister()} />

              {/* Mismatch warning */}
              <AnimatePresence>
                {signupConfirm && signupPassword !== signupConfirm && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-red-400 flex items-center gap-1">
                    <X className="w-3 h-3" /> Passwords do not match
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                onClick={handleCredentialRegister}
                disabled={!signupUsername.trim() || !signupPassword || signupPassword !== signupConfirm || isLoading}
                className="w-full py-3 rounded-lg font-orbitron text-sm font-bold tracking-wider bg-gradient-to-r from-accent-quinary to-accent-secondary text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'CREATE ACCOUNT'}
              </button>

              <p className="text-center text-xs text-white/30 font-orbitron">
                Already have an account?{' '}
                <button onClick={() => setActiveTab('login')} className="text-accent-primary hover:text-accent-primary/80 transition-colors">Log In</button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Version info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[15px] text-white/20 font-mono select-none">
        Frontend {APP_VERSION}{backendVersions.api ? ` · API ${backendVersions.api}` : ''}{backendVersions.multiplayer ? ` · MP ${backendVersions.multiplayer}` : ''}
      </div>
    </div>
  )
}

export default LoginView
