import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import AnimatedBorder from '@/components/AnimatedBorder'
import HistoryCard from '@/components/profile/HistoryCard'
import PerformanceChart from '@/components/profile/PerformanceChart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getLeaderboard } from '@/api/quizAPI'
import {
  fetchUserHistory,
  fetchUserProfile,
  selectHistory,
  selectHistoryLoading,
  selectHistoryError,
  selectHistoryLoaded,
  selectUserProfile,
  selectUserProfileLoading,
  selectUserProfileLoaded,
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
  const userProfile = useSelector(selectUserProfile)
  const userProfileLoading = useSelector(selectUserProfileLoading)
  const userProfileLoaded = useSelector(selectUserProfileLoaded)
  
  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState({ topTen: [], userRank: null })
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  useEffect(() => {
    // ProtectedRoute already guards pages; avoid redirect here to prevent
    // accidental blank render during transient auth state (e.g. hydration).
  }, [user, navigate])

  // Fetch user profile (XP, bestCategory, stats) on mount
  useEffect(() => {
    if (user && !userProfileLoaded && !userProfileLoading) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, user, userProfileLoaded, userProfileLoading])

  useEffect(() => {
    if (user && !historyLoaded && !historyLoading) {
      dispatch(fetchUserHistory())
    }
  }, [dispatch, user, historyLoaded, historyLoading])

  // Fetch leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!user) return
      setLeaderboardLoading(true)
      try {
        const data = await getLeaderboard()
        setLeaderboardData(data)
      } catch (error) {
        console.error('Failed to load leaderboard:', error)
      } finally {
        setLeaderboardLoading(false)
      }
    }
    loadLeaderboard()
  }, [user])

  const stats = useMemo(() => {
    // Only calculate lastActivity from history (for display formatting)
    // All other stats come from userProfile API
    const lastActivity = history
      .map((e) => e?.summary?.created_at)
      .filter(Boolean)
      .map((d) => new Date(d))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => b - a)[0]
    
    return {
      totalAnswers: userProfile?.totalAnswers ?? history.length,
      averageScore: userProfile?.averageScore ?? null,
      bestCategory: userProfile?.bestCategory ?? null,
      lastActivity: formatDate(lastActivity),
    }
  }, [history, userProfile])

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
        <div className="profile-layout">
          {/* Leaderboard Sidebar */}
          <aside className="profile-leaderboard-sidebar">
            <Card className="profile-card h-fit sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {leaderboardLoading ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
                ) : leaderboardData.topTen.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">No data</div>
                ) : (
                  <div className="leaderboard-list">
                    {leaderboardData.topTen.map((entry, index) => (
                      <div
                        key={entry._id || index}
                        className={`leaderboard-item ${
                          entry.username === user?.name || entry.username === user?.email
                            ? 'leaderboard-item-current'
                            : ''
                        }`}
                      >
                        <span className="leaderboard-rank">#{entry.rank}</span>
                        <span className="leaderboard-username" title={entry.username}>
                          {entry.username}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
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
                      {typeof user?.role === 'string' ? user.role : 'Lifelong Learner'}
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
                  </div>
                </CardContent>
              </Card>
            </AnimatedBorder>

            <div className="profile-stats-grid">
              <Card className="profile-card">
                <CardHeader>
                  <CardTitle>Total XP</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="profile-stat-value">
                    {typeof userProfile?.XP === 'number' ? `${userProfile.XP}` : '—'}
                  </p>
                  {/* <p className="profile-stat-label">Recorded attempts</p> */}
                </CardContent>
              </Card>
              <Card className="profile-card">
                <CardHeader>
                  <CardTitle>Avg. Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="profile-stat-value">
                    {typeof stats.averageScore === 'number' ? `${stats.averageScore}` : '—'}
                  </p>
                  {/* <p className="profile-stat-label">Across all answers</p> */}
                </CardContent>
              </Card>
              <Card className="profile-card">
                <CardHeader>
                  <CardTitle>Best Category</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="profile-stat-value">{stats.bestCategory || '—'}</p>
                  {/* <p className="profile-stat-label">Peak Category</p> */}
                </CardContent>
              </Card>
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
                  <CardTitle>Last Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="profile-stat-value text-base">{stats.lastActivity}</p>
                  <p className="profile-stat-label">Most recent answer</p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <section className="profile-chart-section">
            <Card className="profile-card">
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceChart />
              </CardContent>
            </Card>
          </section>

          <section className="profile-history">
            <div className="profile-history-header">
              <div>
                <h2>Question history</h2>
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
                // Use entry.id if available, otherwise fall back to index (not ideal if list order can change)
                <HistoryCard key={entry.id ?? index} entry={entry} defaultOpen={index === 0} />
              ))}
            </div>
          </section>
          </div>
        </div>
      </main>
    </>
  )
}
