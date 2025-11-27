import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Flame, Trophy, TrendingUp } from 'lucide-react'
import { selectHistory } from '@/store/slices/quizSlice'

/**
 * StreakCard - Displays current and longest answer streak
 * 
 * A streak is maintained when user answers questions on consecutive days.
 * Shows current active streak, longest streak, and a visual flame indicator.
 */
export default function StreakCard() {
  const history = useSelector(selectHistory)

  const { currentStreak, longestStreak, isActive } = useMemo(() => {
    if (!history.length) {
      return { currentStreak: 0, longestStreak: 0, isActive: false }
    }

    // Sort history by date (most recent first)
    const sortedDates = history
      .map((entry) => entry?.summary?.created_at)
      .filter(Boolean)
      .map((dateStr) => new Date(dateStr))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b - a)

    if (!sortedDates.length) {
      return { currentStreak: 0, longestStreak: 0, isActive: false }
    }

    // Normalize dates to start of day for comparison
    const normalizedDates = sortedDates.map((date) => {
      const normalized = new Date(date)
      normalized.setHours(0, 0, 0, 0)
      return normalized.getTime()
    })

    // Remove duplicate dates (same day)
    const uniqueDates = [...new Set(normalizedDates)].sort((a, b) => b - a)

    // Calculate current streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime()
    const oneDayMs = 24 * 60 * 60 * 1000

    let current = 0
    let isStreakActive = false

    // Check if most recent activity is today or yesterday
    const mostRecent = uniqueDates[0]
    const daysSinceRecent = Math.floor((todayTime - mostRecent) / oneDayMs)

    if (daysSinceRecent === 0) {
      // Activity today - streak is active
      isStreakActive = true
      current = 1
    } else if (daysSinceRecent === 1) {
      // Activity yesterday - streak continues
      isStreakActive = true
      current = 1
    } else {
      // No recent activity - streak broken
      isStreakActive = false
      current = 0
    }

    // Count consecutive days
    if (isStreakActive) {
      for (let i = 1; i < uniqueDates.length; i++) {
        const daysDiff = Math.floor((uniqueDates[i - 1] - uniqueDates[i]) / oneDayMs)
        if (daysDiff === 1) {
          current++
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    let longest = 0
    let tempStreak = 1

    for (let i = 1; i < uniqueDates.length; i++) {
      const daysDiff = Math.floor((uniqueDates[i - 1] - uniqueDates[i]) / oneDayMs)
      if (daysDiff === 1) {
        tempStreak++
        longest = Math.max(longest, tempStreak)
      } else {
        tempStreak = 1
      }
    }
    longest = Math.max(longest, tempStreak, current)

    return {
      currentStreak: current,
      longestStreak: longest,
      isActive: isStreakActive,
    }
  }, [history])

  return (
    <div className="streak-card">
      <div className="streak-card-header">
        <div className="streak-icon-container">
          <motion.div
            animate={isActive ? {
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            } : {}}
            transition={{
              duration: 2,
              repeat: isActive ? Infinity : 0,
              repeatDelay: 1,
            }}
          >
            <Flame 
              className={`streak-icon ${isActive ? 'streak-icon-active' : 'streak-icon-inactive'}`}
              size={32}
            />
          </motion.div>
        </div>
        <div>
          <h3 className="streak-card-title">Answer Streak</h3>
          <p className="streak-card-subtitle">
            {isActive ? 'Keep it going!' : 'Start a new streak today'}
          </p>
        </div>
      </div>

      <div className="streak-stats">
        <div className="streak-stat">
          <TrendingUp className="streak-stat-icon" size={20} />
          <div>
            <p className="streak-stat-value">{currentStreak}</p>
            <p className="streak-stat-label">Current Streak</p>
          </div>
        </div>

        <div className="streak-divider" />

        <div className="streak-stat">
          <Trophy className="streak-stat-icon" size={20} />
          <div>
            <p className="streak-stat-value">{longestStreak}</p>
            <p className="streak-stat-label">Longest Streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}
