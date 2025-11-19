import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
      
      const userData = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        token: credential,
      }
      
      // Send user info to backend
      await loginUser(userData)
      
      dispatch(loginSuccess(userData))
      navigate('/quiz')
    } catch (error) {
      console.error('Error processing Google Sign-In:', error)
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
                  ⚠️ Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.
                </p>
              )}
            </CardContent>
          </Card>
        </AnimatedBorder>
      </motion.div>
    </div>
  )
}
