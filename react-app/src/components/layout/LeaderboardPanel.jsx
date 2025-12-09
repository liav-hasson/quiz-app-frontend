import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Crown, TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLeaderboard } from '../../api/quizAPI'
import { selectUserProfile } from '../../store/slices/quizSlice'
import { selectBonusXP } from '../../store/slices/tasksSlice'

// Animated XP counter component
const AnimatedXP = ({ value, duration = 1 }) => {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  
  useEffect(() => {
    const prevValue = prevValueRef.current
    if (prevValue !== value) {
      const startTime = Date.now()
      const diff = value - prevValue
      
      const animateValue = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / (duration * 1000), 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(prevValue + diff * eased)
        setDisplayValue(current)
        
        if (progress < 1) {
          requestAnimationFrame(animateValue)
        }
      }
      
      requestAnimationFrame(animateValue)
      prevValueRef.current = value
    }
  }, [value, duration])
  
  return <>{displayValue.toLocaleString()}</>
}

// Top 3 styling config with soft glow
const getTopThreeStyle = (index) => {
  const styles = {
    0: { // Gold - 1st place
      bg: 'bg-yellow-400/15',
      border: 'border-yellow-400/50',
      text: 'text-yellow-300',
      glow: '0 0 12px rgba(250, 204, 21, 0.2)',
      iconGlow: 'drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]'
    },
    1: { // Silver - 2nd place
      bg: 'bg-slate-300/15',
      border: 'border-slate-300/50',
      text: 'text-slate-200',
      glow: '0 0 10px rgba(203, 213, 225, 0.2)',
      iconGlow: 'drop-shadow-[0_0_3px_rgba(203,213,225,0.5)]'
    },
    2: { // Bronze - 3rd place
      bg: 'bg-orange-400/15',
      border: 'border-orange-400/50',
      text: 'text-orange-300',
      glow: '0 0 10px rgba(251, 146, 60, 0.2)',
      iconGlow: 'drop-shadow-[0_0_3px_rgba(251,146,60,0.5)]'
    }
  }
  return styles[index] || null
}

// Single leaderboard entry with animation support
const LeaderboardEntry = ({ user, index, previousRank, isCurrentUser, showRankChangeIndicator }) => {
  const rankChange = previousRank !== null && previousRank !== undefined ? previousRank - index : 0
  const topStyle = getTopThreeStyle(index)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ 
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
      style={topStyle ? { boxShadow: topStyle.glow } : undefined}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all relative ${
        topStyle 
          ? `${topStyle.bg} ${topStyle.border}` 
          : isCurrentUser 
            ? 'bg-accent-primary/10 border-accent-primary/50' 
            : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
    >
      {/* Rank change indicator */}
      <AnimatePresence>
        {showRankChangeIndicator && rankChange !== 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`absolute -right-2 -top-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold z-10 ${
              rankChange > 0 
                ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                : 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
            }`}
          >
            {rankChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(rankChange)}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className={`w-8 h-8 rounded flex items-center justify-center font-arcade text-sm ${
        topStyle ? `${topStyle.text} ${topStyle.iconGlow}` : 'text-text-secondary'
      }`}>
        {index === 0 ? <Crown className="w-5 h-5" /> : `#${index + 1}`}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`font-orbitron text-sm truncate ${
          topStyle ? 'text-white font-medium' : 'text-text-secondary'
        }`}>
          {user.username || user.name || 'Anonymous'}
          {isCurrentUser && <span className="ml-2 text-accent-primary text-xs">(You)</span>}
        </p>
      </div>
      
      <div className="text-right">
        <motion.p 
          className={`font-arcade text-xs ${topStyle ? topStyle.text : 'text-accent-secondary'}`}
          animate={rankChange !== 0 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <AnimatedXP value={user.total_score || 0} duration={0.8} /> XP
        </motion.p>
      </div>
    </motion.div>
  )
}

const LeaderboardPanel = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [previousRanks, setPreviousRanks] = useState({}) // Map of id -> previous rank index
  const [showRankChanges, setShowRankChanges] = useState(false)
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const userProfile = useSelector(selectUserProfile)
  const bonusXP = useSelector(selectBonusXP)
  const fetchedRef = useRef(false)
  const pollIntervalRef = useRef(null)
  const isFirstLoad = useRef(true)
  const leaderboardRef = useRef([]) // Use ref to avoid stale closure

  // Calculate total XP to match profile display
  const totalUserXP = (userProfile?.XP || 0) + (bonusXP || 0)

  const fetchLeaderboardData = useCallback(async () => {
    try {
      const data = await getLeaderboard()
      const newLeaderboard = data.topTen || []
      const oldLeaderboard = leaderboardRef.current
      
      // On subsequent fetches, check for rank changes
      if (!isFirstLoad.current && oldLeaderboard.length > 0) {
        const oldRanks = {}
        oldLeaderboard.forEach((user, idx) => {
          oldRanks[user._id] = idx
        })
        
        // Check if any ranks changed
        let hasChanges = false
        newLeaderboard.forEach((user, idx) => {
          if (oldRanks[user._id] !== undefined && oldRanks[user._id] !== idx) {
            hasChanges = true
          }
        })
        
        if (hasChanges) {
          setPreviousRanks(oldRanks)
          setShowRankChanges(true)
          // Hide rank change indicators after 3 seconds
          setTimeout(() => setShowRankChanges(false), 3000)
        }
      }
      
      leaderboardRef.current = newLeaderboard
      setLeaderboard(newLeaderboard)
      setUserRank(data.userRank)
      isFirstLoad.current = false
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (fetchedRef.current) return
    fetchedRef.current = true

    fetchLeaderboardData()
    
    // Poll for updates every 10 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchLeaderboardData()
    }, 10000)
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [fetchLeaderboardData])

  // Refetch when user XP changes (after answering questions or claiming rewards)
  useEffect(() => {
    if (userProfile?.XP !== undefined && !loading && !isFirstLoad.current) {
      fetchLeaderboardData()
    }
  }, [userProfile?.XP, fetchLeaderboardData])

  if (loading) {
    return <div className="text-center text-text-muted font-orbitron text-xs animate-pulse">LOADING RANKINGS...</div>
  }

  return (
    <div className="flex flex-col">
      {/* Leaderboard entries - fixed height with scroll like chat */}
      <div className="max-h-[70vh] overflow-y-auto space-y-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {leaderboard.map((user, index) => (
            <LeaderboardEntry
              key={user._id || index}
              user={user}
              index={index}
              previousRank={previousRanks[user._id]}
              isCurrentUser={userProfile && user._id === userProfile._id}
              showRankChangeIndicator={showRankChanges}
            />
          ))}
        </AnimatePresence>e>

        {userRank && userRank > 100 && (
          <>
            <div className="flex items-center justify-center py-2">
              <div className="w-1 h-1 bg-white/20 rounded-full mx-1"></div>
              <div className="w-1 h-1 bg-white/20 rounded-full mx-1"></div>
              <div className="w-1 h-1 bg-white/20 rounded-full mx-1"></div>
            </div>
            <motion.div 
              layout
              className="flex items-center gap-3 p-3 rounded-lg border border-accent-primary/50 bg-accent-primary/10"
              style={{ boxShadow: '0 0 15px rgba(217, 70, 239, 0.3)' }}
            >
              <div className="w-8 h-8 rounded flex items-center justify-center font-arcade text-sm text-accent-primary">
                #{userRank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-orbitron text-sm text-white truncate">You</p>
              </div>
              <div className="text-right">
                <p className="font-arcade text-xs text-accent-secondary">
                  <AnimatedXP value={totalUserXP} duration={0.8} /> XP
                </p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

export default LeaderboardPanel
