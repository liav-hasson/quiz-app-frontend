import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import AnimatedBorder from '@/components/AnimatedBorder'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { selectUser, logout } from '@/store/slices/authSlice'
import { getLeaderboard } from '@/api/quizAPI'
import toast from 'react-hot-toast'

export default function Leaderboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
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

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white'
    return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
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
              className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent"
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
                <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-5xl">{getRankEmoji(leaderboardData.userRank)}</div>
                        <div>
                          <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400">Your Rank</h3>
                          <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                            #{leaderboardData.userRank}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getRankBadgeColor(leaderboardData.userRank)} text-lg px-4 py-2 shadow-md`}>
                        {user?.name || user?.email}
                      </Badge>
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
                                entry.username === user?.email || entry.username === user?.name
                                  ? 'bg-purple-500/10'
                                  : ''
                              }`}
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{getRankEmoji(entry.rank)}</span>
                                  <Badge className={getRankBadgeColor(entry.rank)}>
                                    #{entry.rank}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-medium">
                                  {entry.username}
                                  {(entry.username === user?.email || entry.username === user?.name) && (
                                    <Badge variant="outline" className="ml-2">You</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
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
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
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
