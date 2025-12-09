import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loginSuccess } from '../store/slices/authSlice'
import { loginUser } from '../api/quizAPI'
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
  const animatedBackground = useSelector(selectAnimatedBackground)

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
  }, [])

  const handleDevLogin = () => {
    // Only allow dev login in dev mode
    if (import.meta.env.VITE_DEV_MODE !== 'true') return

    const devUser = {
      id: 'dev-user-001',
      name: 'Dev Player',
      email: 'dev@example.com',
      picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev',
      token: 'mock-jwt-token'
    }
    dispatch(loginSuccess(devUser))
    navigate('/')
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
          {/* Google Login Container */}
          <div className="h-[40px] w-full relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            ) : (
              <div id="google-signin-btn" className="w-full flex justify-center"></div>
            )}
          </div>

          {/* Fallback if Google script fails or ID missing */}
          {!isGoogleLoaded && !isLoading && (
             <p className="text-xs text-red-400">Google Sign-In unavailable (Script not loaded)</p>
          )}
          {GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE' && (
             <p className="text-xs text-yellow-400 mt-2">⚠️ Please set VITE_GOOGLE_CLIENT_ID in .env.local</p>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-bg-card px-2 text-text-muted">Developers Only</span>
            </div>
          </div>

          {/* Dev Bypass */}
          {import.meta.env.VITE_DEV_MODE === 'true' && (
            <button 
              onClick={handleDevLogin}
              className="w-full py-3 bg-accent-secondary/10 border border-accent-secondary/30 text-accent-secondary rounded-lg font-orbitron text-sm hover:bg-accent-secondary/20 transition-all"
            >
              &lt; DEV_ACCESS_BYPASS /&gt;
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default LoginView
