import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { logout, selectUser } from '@/store/slices/authSlice'
import { fetchUserHistory, selectHistory, selectHistoryLoading, selectHistoryError, clearHistory } from '@/store/slices/historySlice.js'
import { resetQuiz } from '@/store/slices/quizSlice'
import Header from '@/components/Header'
import HistoryCard from '@/components/HistoryCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import '@/styles/profile.css'

export default function History() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const history = useSelector(selectHistory)
  const historyLoading = useSelector(selectHistoryLoading)
  const historyError = useSelector(selectHistoryError)

  const handleRefreshHistory = () => {
    dispatch(fetchUserHistory())
  }

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
      <main className="profile-page">
        <div className="history-container">
          <motion.section
            className="profile-header-section"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="profile-title">Question History</h1>
          </motion.section>

          <section className="profile-history">
            <div className="profile-history-header">
              <div>
                <h2>Your answered questions</h2>
                <p>Expandable cards show your prompts, answers, and AI feedback.</p>
              </div>
              <div className="profile-history-actions">
                <Button variant="secondary" onClick={handleRefreshHistory} disabled={historyLoading}>
                  {historyLoading ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
            </div>
            {historyError && (
              <div className="profile-history-error">
                Unable to load history right now. {historyError}
              </div>
            )}
            {!history.length && !historyLoading && !historyError && (
              <div className="profile-history-empty">
                Your evaluated answers will appear here after you complete a quiz question.
              </div>
            )}
            {historyLoading && history.length > 0 && (
              <div className="profile-history-loading">Refreshing history…</div>
            )}
            <div className="profile-history-list">
              {history.map((entry, index) => (
                <HistoryCard key={entry.id ?? index} entry={entry} defaultOpen={index === 0} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
