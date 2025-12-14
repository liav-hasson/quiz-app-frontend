import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loginSuccess } from '../store/slices/authSlice'
import { loginUser, guestLoginUser } from '../api/quizAPI'
import { GOOGLE_CLIENT_ID } from '../config.js'
import { Loader2, AlertCircle } from 'lucide-react'
import { selectAnimatedBackground } from '../store/slices/uiSlice'
import PsychedelicSpiral from '../components/ui/PsychedelicSpiral'

const LoginView = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [guestUsername, setGuestUsername] = useState('')
  const animatedBackground = useSelector(selectAnimatedBackground)

  const isLocalEnv = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local')
  )

  const handleGoogleResponse = async (response) => {
    const logs = []
    logs.push('🔐 Google Response Received: ' + JSON.stringify(response))
    console.log('🔐 Google Response Received:', response)
    setIsLoading(true)
    setError(null)
    try {
      logs.push('📡 Calling backend /api/auth/google-login...')
      console.log('📡 Calling backend /api/auth/google-login...')
      const data = await loginUser({ token: response.credential })
      logs.push('📦 Backend Response: ' + JSON.stringify(data))
      console.log('📦 Backend Response:', data)
      
      if (data.error) {
        logs.push('❌ Backend returned error: ' + data.error)
        console.error('❌ Backend returned error:', data.error)
        alert('LOGIN FAILED:\n\n' + logs.join('\n'))
        throw new Error(data.error)
      }
      
      if (!data.token || !data.email) {
        logs.push('❌ Invalid response structure: ' + JSON.stringify(data))
        console.error('❌ Invalid response structure:', data)
        alert('LOGIN FAILED:\n\n' + logs.join('\n'))
        throw new Error('Invalid login response from server')
      }
      
      logs.push('✅ Login successful, saving user data...')
      console.log('✅ Login successful, saving user data...')
      
      // Save to localStorage FIRST before dispatching to Redux
      localStorage.setItem('quiz_user', JSON.stringify(data))
      
      // Then dispatch to Redux
      dispatch(loginSuccess(data))
      
      // Wait a bit more to ensure everything is synced
      await new Promise(resolve => setTimeout(resolve, 100))
      
      logs.push('🚀 Navigating to home...')
      console.log('🚀 Navigating to home...')
      navigate('/')
    } catch (err) {
      logs.push('💥 Login Error: ' + err.message)
      console.error('💥 Login Error:', err)
      alert('LOGIN FAILED:\n\n' + logs.join('\n'))
      setError(err.message || 'Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isLocalEnv) {
      // In local environments we disable Google login and rely on guest flow only.
      return undefined
    }

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
          console.warn('Google Client ID not configured')
          return true
        }

        console.log('Initializing Google Sign-In with:', {
          clientId: GOOGLE_CLIENT_ID,
          origin: window.location.origin
        })

        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false
          })

          const btn = document.getElementById('google-signin-btn')
          if (btn) {
            window.google.accounts.id.renderButton(
              btn,
              { 
                theme: 'filled_black', 
                size: 'large', 
                width: 250, 
                text: 'continue_with' 
              }
            )
            setIsGoogleLoaded(true)
            return true
          }
        } catch (err) {
          console.error('Google Sign-In initialization failed:', err)
          setError('Google Sign-In configuration error')
          return true
        }
      }
      return false
    }

    if (!initializeGoogle()) {
      const interval = setInterval(() => {
        if (initializeGoogle()) {
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isLocalEnv])

  // Guest login handler for "Continue as Guest" option
  const handleGuestLogin = async () => {
    if (!isLocalEnv) {
      setError('Guest login disabled in deployed environments. Please use Google Sign-In.')
      return
    }

    if (!guestUsername.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await guestLoginUser({ username: guestUsername.trim() })

      // Check if API key exists; if not, send the user to Settings to add it
      let settings = null
      try {
        settings = JSON.parse(localStorage.getItem('quiz_ai_settings'))
      } catch (e) {
        settings = null
      }
      const needsApiKey = !settings || !settings.customApiKey
      
      // Save to localStorage first
      localStorage.setItem('quiz_user', JSON.stringify(data))
      
      // Then dispatch to Redux
      dispatch(loginSuccess(data))

      // Navigate home - if API key missing, banner will show there
      navigate('/')
    } catch (err) {
      setError(err.message || 'Guest login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Dev bypass now uses guest login with auto-generated username
  const handleDevLogin = async () => {
    // Only allow dev login in dev mode
    if (import.meta.env.VITE_DEV_MODE !== 'true') return

    const devUsername = `dev_${Date.now().toString(36)}`
    setGuestUsername(devUsername)
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await guestLoginUser({ username: devUsername })
      localStorage.setItem('quiz_user', JSON.stringify(data))
      dispatch(loginSuccess(data))
      navigate('/')
    } catch (err) {
      setError(err.message || 'Dev login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      {animatedBackground ? (
        <PsychedelicSpiral
          className="absolute inset-0 pointer-events-none"
          spinRotation={-0.3}
          spinSpeed={1.5}
          color1="#050505"
          color2="#0f0f0f"
          color3="#1a1a1a"
          contrast={2.5}
          lighting={0.4}
          spinAmount={0.2}
          pixelFilter={500}
          isRotate={true}
        />
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
        className="relative z-10 bg-bg-card/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-auto text-center"
      >
        <div className="mb-8">
          <h1 className="font-arcade text-4xl tracking-tighter flex justify-center mb-4">
            {"QuizLabs".split('').map((char, index) => (
              <span 
                key={index} 
                className="animate-neon-cycle hover:animate-none hover:text-white transition-colors"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {char}
              </span>
            ))}
          </h1>
          <p className="text-text-secondary font-orbitron text-sm">
            LOG IN WITH GOOGLE
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Google Login Container (disabled in local environments) */}
          {!isLocalEnv && (
            <>
              <div className="h-[40px] w-full relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  </div>
                ) : (
                  <div id="google-signin-btn" className="w-full flex justify-center"></div>
                )}
              </div>

              {!isGoogleLoaded && !isLoading && (
                 <p className="text-xs text-red-400">Google Sign-In unavailable (Script not loaded)</p>
              )}
              {GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE' && (
                 <p className="text-xs text-yellow-400 mt-2">⚠️ Please set VITE_GOOGLE_CLIENT_ID in .env.local</p>
              )}
            </>
          )}

          {isLocalEnv && (
            <p className="text-xs text-text-secondary">Google login is disabled for local setups. Use guest login below.</p>
          )}

          {/* Guest Login Section */}
          <div className="mt-6 space-y-3">
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-card px-2 text-text-muted">Or continue as guest</span>
              </div>
            </div>
            
            <input
              type="text"
              value={guestUsername}
              onChange={(e) => setGuestUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
              placeholder="Enter a username"
              maxLength={30}
              disabled={isLoading}
              className="w-full p-3 bg-bg-card-light border border-white/10 rounded-lg text-white placeholder:text-text-muted focus:border-accent-primary outline-none transition-colors disabled:opacity-50"
            />
            
            <button
              onClick={handleGuestLogin}
              disabled={!guestUsername.trim() || isLoading || !isLocalEnv}
              className="w-full py-3 bg-accent-primary/20 border border-accent-primary/50 text-accent-primary rounded-lg font-orbitron text-sm hover:bg-accent-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Continue as Guest'}
            </button>
            {!isLocalEnv && (
              <p className="text-xs text-text-secondary">Guest login is only available in local environments.</p>
            )}
          </div>

          {/* Dev Bypass - only visible in dev mode */}
          {import.meta.env.VITE_DEV_MODE === 'true' && (
            <div className="mt-4">
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-bg-card px-2 text-text-muted">Developers Only</span>
                </div>
              </div>
              <button 
                onClick={handleDevLogin}
                disabled={isLoading}
                className="w-full py-3 bg-accent-secondary/10 border border-accent-secondary/30 text-accent-secondary rounded-lg font-orbitron text-sm hover:bg-accent-secondary/20 transition-all disabled:opacity-50"
              >
                &lt; DEV_ACCESS_BYPASS /&gt;
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default LoginView
