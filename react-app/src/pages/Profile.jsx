import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import AnimatedBorder from '@/components/AnimatedBorder'
import HistoryCard from '@/components/profile/HistoryCard'
import PerformanceChart from '@/components/profile/PerformanceChart'
import CategoryRadarChart from '@/components/profile/CategoryRadarChart'
import StreakCard from '@/components/profile/StreakCard'
import StudyRecommendations from '@/components/profile/StudyRecommendations'
import ShareProfile from '@/components/profile/ShareProfile'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
    // Stats come from userProfile API
    return {
      totalAnswers: userProfile?.totalAnswers ?? history.length,
      averageScore: userProfile?.averageScore ?? null,
      bestCategory: userProfile?.bestCategory ?? null,
    }
  }, [history, userProfile])

  const stats = useMemo(() => {
    // Stats come from userProfile API
    return {
      totalAnswers: userProfile?.totalAnswers ?? history.length,
      averageScore: userProfile?.averageScore ?? null,
      bestCategory: userProfile?.bestCategory ?? null,
    }
  }, [history, userProfile])

  // Pagination for history
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return history.slice(startIndex, endIndex)
  }, [history, currentPage, itemsPerPage])

  const totalPages = Math.ceil(history.length / itemsPerPage)

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    // Scroll to history section
    document.querySelector('.profile-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleRefreshHistory = () => {
    dispatch(fetchUserHistory())
    setCurrentPage(1) // Reset to first page on refresh
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
                          entry.username === user?.name || entry.username === user?.email || entry.email === user?.email
                            ? 'leaderboard-item-current'
                            : ''
                        }`}
                      >
                        <span className="leaderboard-rank">#{entry.rank}</span>
                        <div className="leaderboard-user-info">
                          <span className="leaderboard-username" title={entry.username || entry.email}>
                            {entry.username || entry.name || entry.email}
                          </span>
                          <span className="leaderboard-xp">
                            {entry.total_score || 0} XP
                          </span>
                        </div>
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
                      {userProfile?.levelName || 'Novice'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="profile-user-copy mb-4">
                    Track your AI-evaluated answers, monitor progress, and keep sharpening your DevOps mastery.
                  </p>
                  {userProfile?.levelProgress && (
                    <div className="profile-progress-card">
                      <div className="profile-progress-header">
                        <div>
                          <p className="profile-progress-label">Next Level</p>
                          <p className="profile-progress-value">
                            {userProfile.levelProgress.nextLevelName}
                          </p>
                        </div>
                        <div className="profile-progress-percentage">
                          <p className="profile-progress-label">Progress</p>
                          <p className="profile-progress-value">
                            {Math.round(userProfile.levelProgress.progressPercentage || 0)}%
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={userProfile.levelProgress.progressPercentage || 0} 
                        className="profile-progress-bar"
                      />
                      <p className="profile-progress-xp">
                        {userProfile.levelProgress.xpIntoLevel || 0} / {userProfile.levelProgress.xpNeeded || 0} XP
                      </p>
                    </div>
                  )}
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
                </CardContent>
              </Card>
              <Card className="profile-card">
                <CardHeader>
                  <CardTitle>Best Category</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="profile-stat-value">{stats.bestCategory || '—'}</p>
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
                  <p className="profile-stat-value text-xs">{stats.lastActivity}</p>
                  <p className="profile-stat-label">Most recent answer</p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <section className="profile-streak-section">
            <Card className="profile-card">
              <CardContent className="profile-streak-content">
                <StreakCard />
              </CardContent>
            </Card>
          </section>

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

          <section className="profile-chart-section">
            <Card className="profile-card">
              <CardHeader>
                <CardTitle>Knowledge by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryRadarChart />
              </CardContent>
            </Card>
          </section>

          <section className="profile-chart-section">
            <StudyRecommendations />
          </section>

          <section className="profile-chart-section">
            <ShareProfile user={user} userProfile={userProfile} />
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
            {historyLoading && !history.length && (
              <div className="profile-history-loading">Loading history…</div>
            )}
            <div className="profile-history-list">
              {paginatedHistory.map((entry, index) => (
                // Use entry.id if available, otherwise fall back to index (not ideal if list order can change)
                <HistoryCard 
                  key={entry.id ?? index} 
                  entry={entry} 
                  defaultOpen={index === 0 && currentPage === 1} 
                />
              ))}
            </div>
            {history.length > itemsPerPage && (
              <div className="profile-history-pagination">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </Button>
                <div className="pagination-info">
                  <span className="pagination-current">Page {currentPage}</span>
                  <span className="pagination-separator">of</span>
                  <span className="pagination-total">{totalPages}</span>
                  <span className="pagination-count">
                    ({history.length} total)
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </Button>
              </div>
            )}
          </section>
          </div>

          {/* Right Sidebar - Empty for now */}
          <aside className="profile-right-sidebar">
            {/* Placeholder for future content */}
          </aside>
        </div>
      </main>
    </>
  )
}
