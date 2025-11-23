import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import QuizSetup from '@/components/quiz/QuizSetup'
import QuizQuestion from '@/components/quiz/QuizQuestion'
import QuizResults from '@/components/quiz/QuizResults'

import {
  selectCurrentPage,
  selectError,
  fetchCategoriesWithSubjects,
  resetQuiz,
  clearHistory,
} from '@/store/slices/quizSlice'
import { selectUser, logout } from '@/store/slices/authSlice'

export default function Quiz() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const user = useSelector(selectUser)
  const currentPage = useSelector(selectCurrentPage)
  const error = useSelector(selectError)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // Fetch categories with subjects on mount (single API call, cached)
  useEffect(() => {
    dispatch(fetchCategoriesWithSubjects())
  }, [dispatch])

  // Show error toasts
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const handleLogout = () => {
    dispatch(logout())
    dispatch(resetQuiz())
    dispatch(clearHistory())
    navigate('/login')
  }

  const handleProfileClick = () => {
    navigate('/profile')
  }

  return (
    <>
      <Header user={user} onLogout={handleLogout} onProfileClick={handleProfileClick} />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--accent-quinary-light)',
          },
        }}
      />
      
      <div className="min-h-screen flex items-center justify-center p-5 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          {currentPage === 'setup' && <QuizSetup />}
          {currentPage === 'question' && <QuizQuestion />}
          {currentPage === 'results' && <QuizResults />}
        </motion.div>
      </div>
    </>
  )
}
