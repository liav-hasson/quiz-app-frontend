import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import AnimatedBorder from '@/components/AnimatedBorder'
import HistoryCard from '@/components/profile/HistoryCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  fetchUserHistory,
  selectHistory,
  selectHistoryLoading,
  selectHistoryError,
  selectHistoryLoaded,
  resetQuiz,
  clearHistory,
} from '@/store/slices/quizSlice'
import { selectUser, logout } from '@/store/slices/authSlice'

const parseScoreValue = (score) => {
  if (typeof score === 'number') return score
  if (typeof score === 'string') {
    const match = score.match(/(\d+)/)
    if (match) {
      return Number(match[1])
    }
  }
  return null
}

const formatDate = (value) => {
  if (!value) return 'Never'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function Profile() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const history = useSelector(selectHistory)
  const historyLoading = useSelector(selectHistoryLoading)
  const historyError = useSelector(selectHistoryError)
  const historyLoaded = useSelector(selectHistoryLoaded)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user && !historyLoaded) {
      dispatch(fetchUserHistory())
    }
  }, [dispatch, user, historyLoaded])

  const stats = useMemo(() => {
    const numericScores = history
      .map((entry) => parseScoreValue(entry?.summary?.score))
      .filter((value) => typeof value === 'number')
    const totalAnswers = history.length
    const averageScore = numericScores.length
      ? Math.round(numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length)
      : null
    const bestScore = numericScores.length ? Math.max(...numericScores) : null
    const lastActivity = history[0]?.summary?.created_at

    return {
      totalAnswers,
      averageScore,
      bestScore,
      lastActivity: formatDate(lastActivity),
    }
  }, [history])

  const handleRefreshHistory = () => {
    dispatch(fetchUserHistory())
  }

  const handleBackToQuiz = () => {
    navigate('/quiz')
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
        <div className="profile-container">
          <motion.section
            className="profile-hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnimatedBorder>
              <Card className="profile-card profile-user-card">
                <CardHeader className="profile-user-header">
                  <img
                    src={user?.picture ?? '/default-avatar.png'}
                    alt={user?.name ?? user?.email ?? 'User avatar'}
                    className="profile-avatar"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <CardTitle className="profile-user-name">{user?.name || 'Quiz Explorer'}</CardTitle>
                    <p className="profile-user-email">{user?.email}</p>
                    <Badge variant="secondary" className="profile-role-pill">
                      Lifelong Learner
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="profile-user-copy">
                    Track your AI-evaluated answers, monitor progress, and keep sharpening your DevOps mastery.
                  </p>
                  <div className="profile-user-actions">
                    <Button variant="outline" onClick={handleBackToQuiz}>
                      Back to Quiz
                    </Button>
                    <Button variant="ghost" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AnimatedBorder>

            <div className="profile-stats-grid">
              <Card className="profile-card">
                <CardHeader>
                  <CardTitle>Total Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="profile-stat-value">{stats.totalAnswers}</p>
                  <p className="profile-stat-label">Recorded attempts</p>
                </CardContent>
              </Card>
              <Card className="profile-card">
                <CardHeader>
                  <CardTitle>Avg. Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="profile-stat-value">
                    {typeof stats.averageScore === 'number' ? `${stats.averageScore}/10` : '—'}
                  </p>
                  <p className="profile-stat-label">Across saved answers</p>
                </CardContent>
              </Card>
              <Card className="profile-card">
                <CardHeader>
                  <CardTitle>Best Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="profile-stat-value">
                    {typeof stats.bestScore === 'number' ? `${stats.bestScore}/10` : '—'}
                  </p>
                  <p className="profile-stat-label">Peak performance</p>
                </CardContent>
              </Card>
              <Card className="profile-card">
                <CardHeader>
                  <CardTitle>Last Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="profile-stat-value text-base">{stats.lastActivity}</p>
                  <p className="profile-stat-label">Most recent answer</p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <section className="profile-history">
            <div className="profile-history-header">
              <div>
                <h2>Question history</h2>
                <p>Expandable cards show your prompts, answers, and AI feedback.</p>
              </div>
              <div className="profile-history-actions">
                <Button variant="outline" onClick={handleBackToQuiz}>
                  Continue Quiz
                </Button>
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
                // Use entry.id if available, otherwise fall back to index (not ideal if list order can change)
                <HistoryCard key={entry.id ?? index} entry={entry} defaultOpen={index === 0} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
