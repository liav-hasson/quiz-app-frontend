import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import AnimatedBorder from '@/components/AnimatedBorder'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { selectUser, logout } from '@/store/slices/authSlice'
import { selectUserProfile } from '@/store/slices/quizSlice'
import { getLeaderboard } from '@/api/quizAPI'
import toast from 'react-hot-toast'

export default function Leaderboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const userProfile = useSelector(selectUserProfile)
  const [leaderboardData, setLeaderboardData] = useState({ topTen: [], userRank: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const data = await getLeaderboard()
      setLeaderboardData(data)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleProfileClick = () => {
    navigate('/profile')
  }

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white'
    return 'bg-gradient-primary text-white'
  }

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return '🏅'
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={handleLogout} onProfileClick={handleProfileClick} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Page Title */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent"
            >
              🏆 Leaderboard
            </motion.h1>
          </div>

          {/* User Rank Card */}
          {leaderboardData.userRank && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <AnimatedBorder>
                <Card className="bg-gradient-to-br from-accent-secondary/15 to-accent-tertiary/15 border-2 border-accent-secondary/30 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-6">
                      <div className="flex items-center justify-center flex-shrink-0 w-1/4">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold mb-1 text-accent-secondary">Your Rank</h3>
                          <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            #{leaderboardData.userRank}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-6">
                        <div className="flex flex-col justify-center text-center">
                          <p className="text-sm text-muted-foreground mb-2">Total XP</p>
                          <p className="text-xl font-bold text-accent-secondary">
                            {typeof userProfile?.XP === 'number' ? userProfile.XP : '—'}
                          </p>
                        </div>
                        <div className="flex flex-col justify-center text-center">
                          <p className="text-sm text-muted-foreground mb-2">Level</p>
                          <p className="text-xl font-medium">
                            {userProfile?.levelName || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedBorder>
            </motion.div>
          )}

          {/* Top 10 Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <AnimatedBorder>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Top 10 Champions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading leaderboard...
                    </div>
                  ) : leaderboardData.topTen.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No leaderboard data available yet. Start taking quizzes!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Rank</th>
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Player</th>
                            <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardData.topTen.map((entry, index) => (
                            <motion.tr
                              key={entry._id || index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + index * 0.05 }}
                              className={`border-b border-border hover:bg-accent/50 transition-colors ${
                                (entry.username === user?.email || 
                                 entry.username === user?.name || 
                                 entry.rank === leaderboardData.userRank)
                                  ? 'bg-accent-secondary/15 border-l-4 border-l-accent-secondary'
                                  : ''
                              }`}
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{getRankEmoji(entry.rank)}</span>
                                  <Badge className={getRankBadgeStyle(entry.rank)}>
                                    #{entry.rank}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-medium">
                                  {entry.username}
                                  {(entry.username === user?.email || 
                                    entry.username === user?.name || 
                                    entry.rank === leaderboardData.userRank) && (
                                    <Badge variant="outline" className="ml-2 bg-accent-secondary/15 border-accent-secondary">You</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="text-lg font-bold text-accent-secondary">
                                  {typeof entry.score === 'number' ? entry.score.toFixed(2) : entry.score}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AnimatedBorder>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-gradient-to-r from-accent-tertiary/10 to-accent-secondary/10">
              <CardContent className="py-6">
                <p className="text-center text-sm text-muted-foreground">
                  Rankings are based on your weighted average score across all quizzes.
                  Keep practicing to climb the leaderboard!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
