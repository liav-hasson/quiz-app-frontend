import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import AnimatedBorder from '@/components/AnimatedBorder'
import { loginSuccess, selectIsAuthenticated } from '@/store/slices/authSlice'
import { loginUser } from '@/api/quizAPI'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/quiz')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID not configured. Add it to your .env file.')
      return
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      })

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'filled_blue',
          size: 'large',
          width: 280,
          text: 'signin_with',
        }
      )
    }
  }, [])

  const handleCredentialResponse = async (response) => {
    try {
      const credential = response.credential
      const payload = JSON.parse(atob(credential.split('.')[1]))
      
      // Send Google credential to backend for verification
      const backendResponse = await loginUser({ token: credential })
      
      // Check if backend call was successful
      if (!backendResponse || backendResponse.ok === false) {
        throw new Error(backendResponse?.error || 'Backend authentication failed')
      }
      
      // Backend returns our app's JWT token + user info
      const userData = {
        id: payload.sub,
        email: backendResponse.email || payload.email,
        name: backendResponse.name || payload.name,
        picture: backendResponse.picture || payload.picture,
        token: backendResponse.token || credential,
      }
      
      dispatch(loginSuccess(userData))
      navigate('/quiz')
    } catch (error) {
      console.error('Error processing Google Sign-In:', error)
      toast.error('Failed to login. Please try again.')
    }
  }

  // DEV MODE: Simple dev login button (for when Google OAuth is not configured)
  const handleDevLogin = async () => {
    try {
      // Create a mock Google credential for dev user
      const devPayload = {
        sub: 'dev-user-123',
        email: 'developer@test.com',
        name: 'Dev User',
        picture: '/assets/Quizlabs-Icon.svg',
      }
      
      // Create a simple JWT-like token for dev mode (not real JWT, just for structure)
      const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
      const payload = btoa(JSON.stringify(devPayload))
      const mockCredential = `${header}.${payload}.dev-signature`
      
      // Send to backend to create/login dev user
      const backendResponse = await loginUser({ token: mockCredential })
      
      // Use backend response if successful, otherwise use dev data
      const userData = {
        id: devPayload.sub,
        email: backendResponse?.email || devPayload.email,
        name: backendResponse?.name || devPayload.name,
        picture: backendResponse?.picture || devPayload.picture,
        token: backendResponse?.token || mockCredential,
      }
      
      dispatch(loginSuccess(userData))
      navigate('/quiz')
    } catch (error) {
      console.error('Dev login error:', error)
      // Fallback to local-only dev login if backend fails
      const devUser = {
        id: 'dev-user-123',
        email: 'developer@test.com',
        name: 'Dev User',
        picture: '/assets/Quizlabs-Icon.svg',
        token: 'dev-token-123',
      }
      dispatch(loginSuccess(devUser))
      navigate('/quiz')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <AnimatedBorder>
          <Card className="login-card">
            <CardHeader>
              <CardTitle className="login-title">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="gradient-login-title"
                >
                  Quiz Labs
                </motion.div>
              </CardTitle>
            </CardHeader>
            <CardContent className="login-content">
              <p className="login-desc">
                Sign in with your Google account to start taking quizzes
              </p>
              <div className="flex justify-center">
                <div id="google-signin-button"></div>
              </div>
              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <p className="login-warning">
                  ⚠️ Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.
                </p>
              )}
              
              {/* DEV MODE: Quick login button for local development only */}
              {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                <>
                  <div className="my-4 text-center text-sm text-muted-foreground">
                    — OR —
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={handleDevLogin}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                    >
                      🚀 Dev Login (Skip Google)
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </AnimatedBorder>
      </motion.div>
    </div>
  )
}
