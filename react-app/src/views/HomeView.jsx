import React, { useState, useEffect, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Flame, Star, History, ArrowLeft, Key } from 'lucide-react'
import { selectUser } from '../store/slices/authSlice'
import { selectSelectedHistoryItem, setSelectedHistoryItem, setActiveTab } from '../store/slices/uiSlice'
import { selectHasCustomApiKey, reloadSettings } from '../store/slices/settingsSlice'
import { REQUIRES_USER_API_KEY } from '../config.js'
import { getDailyStreak } from '../api/quizAPI'
import { 
  selectUserProfile, 
  selectHistory, 
  fetchUserProfile, 
  fetchUserHistory,
  fetchCategoriesWithSubjects,
  selectCategories
} from '../store/slices/quizSlice'
import { initializeTasks, selectBonusXP } from '../store/slices/tasksSlice'
import DailyTasks from '../components/layout/DailyTasks'
import { CATEGORY_SECTIONS } from '../constants/categoryGroups'

// Color class mappings for Tailwind JIT - these must be static strings for the build process
const colorClasses = {
  'accent-primary': {
    bgLight: 'bg-accent-primary/5',
    bgHover: 'group-hover:bg-accent-primary/10',
    bgIcon: 'bg-accent-primary/20',
    text: 'text-accent-primary'
  },
  'accent-secondary': {
    bgLight: 'bg-accent-secondary/5',
    bgHover: 'group-hover:bg-accent-secondary/10',
    bgIcon: 'bg-accent-secondary/20',
    text: 'text-accent-secondary'
  },
  'accent-tertiary': {
    bgLight: 'bg-accent-tertiary/5',
    bgHover: 'group-hover:bg-accent-tertiary/10',
    bgIcon: 'bg-accent-tertiary/20',
    text: 'text-accent-tertiary'
  }
}

const StatCard = memo(function StatCard({ icon: Icon, label, value, color }) {
  const classes = colorClasses[color] || colorClasses['accent-primary']
  
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-bg-card-light/80 backdrop-blur-md border border-white/5 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 relative overflow-hidden group"
    >
      <div className={`absolute inset-0 ${classes.bgLight} ${classes.bgHover} transition-colors`} />
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${classes.bgIcon} flex items-center justify-center ${classes.text}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div>
        <p className="text-text-secondary text-[10px] sm:text-xs font-orbitron uppercase tracking-wider">{label}</p>
      <p className="text-xl sm:text-2xl font-arcade text-white mt-1">{value}</p>
    </div>
  </motion.div>
  )
})// Level calculation: 100 XP per level
const calculateLevel = (xp) => {
  if (!xp) return { level: 1, nextLevelXP: 100, progress: 0, xpIntoLevel: 0 }
  
  const level = Math.floor(xp / 100) + 1
  const xpIntoLevel = xp % 100
  const progress = xpIntoLevel
  const nextLevelXP = level * 100
  
  return { level, nextLevelXP, progress, xpIntoLevel }
}

const HistoryDetailView = ({ item, onBack }) => (
  <div className="space-y-6 animate-fade-in">
    <button 
      onClick={onBack}
      className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-4"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Dashboard
    </button>
    
    <div className="bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-arcade text-lg text-accent-primary mb-2">{item.summary.category}</h2>
          <p className="text-sm text-text-secondary">{item.summary.subject}</p>
        </div>
        <div className="text-right">
          <div className={`font-arcade text-2xl ${item.summary.score >= 7 ? 'text-green-400' : 'text-orange-400'}`}>
            {String(item.summary.score).includes('/') ? item.summary.score : `${item.summary.score}/10`}
          </div>
          <p className="text-xs text-text-muted">{new Date(item.summary.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-orbitron text-text-secondary mb-2">QUESTION</h3>
          <p className="text-white bg-white/5 p-4 rounded-xl border border-white/5 font-sans text-sm leading-relaxed">
            {item.details.question}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-orbitron text-text-secondary mb-2">YOUR ANSWER</h3>
          <p className="text-white bg-white/5 p-4 rounded-xl border border-white/5 font-sans text-sm leading-relaxed">
            {item.details.answer}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-orbitron text-text-secondary mb-2">EVALUATION</h3>
          <div className="text-sm text-text-primary bg-accent-primary/5 p-4 rounded-xl border border-accent-primary/20 font-sans leading-relaxed">
            {item.details.evaluation?.feedback || item.details.feedback || "No feedback available."}
          </div>
        </div>
      </div>
    </div>
  </div>
)

const HomeView = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const userProfile = useSelector(selectUserProfile)
  const history = useSelector(selectHistory)
  const selectedHistoryItem = useSelector(selectSelectedHistoryItem)
  const bonusXP = useSelector(selectBonusXP)
  const categories = useSelector(selectCategories)
  const hasApiKey = useSelector(selectHasCustomApiKey)
  
  const [isHovering, setIsHovering] = useState(false)
  const [flickerState, setFlickerState] = useState({})
  const [prevXP, setPrevXP] = useState(0)
  const [prevLevel, setPrevLevel] = useState(1)
  const [isLevelingUp, setIsLevelingUp] = useState(false)
  const [xpProgress, setXpProgress] = useState(0)
  const [streak, setStreak] = useState({ current_streak: 0, active: false })
  
  const name = user?.name || "PLAYER ONE"
  const colors = ['#d946ef', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#facc15', '#f97316']

  useEffect(() => {
    // Reload settings from localStorage on mount (important after login/localStorage changes)
    dispatch(reloadSettings())
    
    // Delay fetching to ensure token is in localStorage
    const timer = setTimeout(() => {
      dispatch(fetchUserProfile())
      dispatch(fetchUserHistory({ limit: 100 })) // Fetch more history for better best category calculation
      dispatch(fetchCategoriesWithSubjects())
      getDailyStreak()
        .then(data => {
          if (data?.current_streak !== undefined) setStreak(data)
        })
        .catch(() => {})
    }, 200)
    
    return () => clearTimeout(timer)
  }, [dispatch])

  useEffect(() => {
    const handleStreakUpdate = (e) => {
      if (e.detail) setStreak(e.detail)
    }
    window.addEventListener('daily-streak-updated', handleStreakUpdate)
    return () => window.removeEventListener('daily-streak-updated', handleStreakUpdate)
  }, [])

  // Calculate best high-level category from user history
  const bestHighLevelCategory = React.useMemo(() => {
    if (!history || history.length === 0) return '-'
    
    // Initialize scores for all sections
    const sectionScores = {}
    const sectionCounts = {}
    
    CATEGORY_SECTIONS.forEach(section => {
      sectionScores[section.id] = 0
      sectionCounts[section.id] = 0
    })
    
    // Calculate total scores from user history, grouped by section
    history.forEach(entry => {
      const category = entry.summary?.category
      const score = entry.summary?.score
      
      if (!category || score === undefined) return
      
      // Parse score (handle both "8/10" and 8 formats)
      let numericScore = 0
      if (typeof score === 'number') {
        numericScore = score
      } else if (typeof score === 'string') {
        if (score.includes('/')) {
          numericScore = parseFloat(score.split('/')[0])
        } else {
          numericScore = parseFloat(score)
        }
      }
      
      // Find which section this category belongs to
      const matchedSection = CATEGORY_SECTIONS.find(section => 
        section.categories.some(cat => cat.toLowerCase() === category.toLowerCase())
      )
      
      if (matchedSection && !isNaN(numericScore)) {
        sectionScores[matchedSection.id] += numericScore
        sectionCounts[matchedSection.id] += 1
      }
    })
    
    // Find section with highest average score
    let bestSection = null
    let bestAvg = -1
    
    CATEGORY_SECTIONS.forEach(section => {
      const count = sectionCounts[section.id]
      if (count > 0) {
        const avg = sectionScores[section.id] / count
        if (avg > bestAvg) {
          bestAvg = avg
          bestSection = section
        }
      }
    })
    
    return bestSection ? bestSection.name : '-'
  }, [history])

  useEffect(() => {
    if (categories && categories.length > 0) {
      dispatch(initializeTasks(categories))
    }
  }, [categories, dispatch])

  const totalXP = (userProfile?.XP || 0) + (bonusXP || 0)
  const { level, nextLevelXP, progress, xpIntoLevel } = calculateLevel(totalXP)

  // XP animation effect
  useEffect(() => {
    const currentXP = totalXP
    const currentLevel = level

    if (currentXP > prevXP && prevXP > 0) {
      // XP gained - animate from previous to current
      const prevProgress = prevXP % 100
      const newProgress = currentXP % 100
      
      // Check if leveled up
      if (currentLevel > prevLevel) {
        setIsLevelingUp(true)
        // Animate to 100% first
        setXpProgress(prevProgress)
        setTimeout(() => {
          setXpProgress(100)
        }, 50)
        // Then reset and animate to new progress
        setTimeout(() => {
          setIsLevelingUp(false)
          setXpProgress(0)
          setTimeout(() => setXpProgress(newProgress), 100)
        }, 1500)
      } else {
        // Normal XP gain animation
        setXpProgress(prevProgress)
        setTimeout(() => setXpProgress(newProgress), 100)
      }
    } else {
      // Initial load or no change
      setXpProgress(progress)
    }

    setPrevXP(currentXP)
    setPrevLevel(currentLevel)
  }, [totalXP, level])

  useEffect(() => {
    let interval;
    let timeout;

    if (isHovering) {
      // Stop the flickering effect after 2 seconds
      timeout = setTimeout(() => {
        clearInterval(interval);
      }, 1000);

      interval = setInterval(() => {
        if (Math.random() > 0.1) {
            const idx = Math.floor(Math.random() * name.length);
            if (name[idx] !== ' ') {
                const color = colors[Math.floor(Math.random() * colors.length)];
                setFlickerState(prev => ({ ...prev, [idx]: color }));
                
                // Letters stay lit longer (200ms - 500ms)
                setTimeout(() => {
                    setFlickerState(prev => {
                        const next = { ...prev };
                        delete next[idx];
                        return next;
                    });
                }, Math.random() * 200 + 200);
            }
        }
      }, 50);
    } else {
      setFlickerState({});
    }
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isHovering, name]);

  if (selectedHistoryItem) {
    return <HistoryDetailView item={selectedHistoryItem} onBack={() => dispatch(setSelectedHistoryItem(null))} />
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* API Key Setup Banner - Only show when user must provide their own API key */}
      {!hasApiKey && REQUIRES_USER_API_KEY && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            dispatch(setActiveTab('settings'))
          }}
          className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center gap-3 cursor-pointer hover:bg-amber-500/30 transition-all group"
        >
          <Key className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-orbitron text-sm text-white">Set Your OpenAI API Key</p>
            <p className="text-xs text-text-secondary">Required to generate questions and play</p>
          </div>
          <span className="text-amber-400 text-xs font-orbitron group-hover:translate-x-1 transition-transform">→</span>
        </motion.div>
      )}

      {/* User Header */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-gradient-to-r from-bg-card-light to-transparent backdrop-blur-md rounded-2xl border border-white/5">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary p-1 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
          <img 
            src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
            alt="User" 
            className="w-full h-full rounded-full bg-bg-dark"
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2 flex-wrap">
            <h1 
              className="text-xl sm:text-3xl font-arcade text-white cursor-default select-none"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {name.split('').map((char, i) => (
                <span 
                  key={i} 
                  style={{ 
                    color: flickerState[i] || 'white',
                    textShadow: flickerState[i] ? `0 0 10px ${flickerState[i]}, 0 0 20px ${flickerState[i]}` : 'none',
                    transition: 'color 0.05s, text-shadow 0.05s'
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h1>
            <motion.span 
              animate={isLevelingUp ? {
                scale: [1, 1.3, 1],
              } : {}}
              transition={{ duration: 0.5 }}
              className={`px-2 py-1 rounded text-xs font-orbitron border ${(() => {
                const colorCycle = Math.floor((level - 1) / 5) % 6
                const brightnessStep = ((level - 1) % 5) + 1 // 1-5
                const baseOpacity = 10 + brightnessStep * 6 // 16, 22, 28, 34, 40
                const glowOpacity = 0.2 + brightnessStep * 0.15 // 0.35, 0.5, 0.65, 0.8, 0.95
                
                const colorMap = {
                  0: { bg: 'cyan', rgb: '6,182,212' },
                  1: { bg: 'purple', rgb: '168,85,247' },
                  2: { bg: 'pink', rgb: '236,72,153' },
                  3: { bg: 'green', rgb: '34,197,94' },
                  4: { bg: 'yellow', rgb: '234,179,8' },
                  5: { bg: 'orange', rgb: '249,115,22' },
                }
                const c = colorMap[colorCycle]
                return `bg-${c.bg}-500/${baseOpacity} text-${c.bg}-400 border-${c.bg}-500/${baseOpacity + 20}`
              })()}`}
              style={{
                boxShadow: (() => {
                  const colorCycle = Math.floor((level - 1) / 5) % 6
                  const brightnessStep = ((level - 1) % 5) + 1
                  const glowOpacity = 0.2 + brightnessStep * 0.15
                  const colorRgb = {
                    0: '6,182,212',
                    1: '168,85,247',
                    2: '236,72,153',
                    3: '34,197,94',
                    4: '234,179,8',
                    5: '249,115,22',
                  }[colorCycle]
                  return `0 0 ${8 + brightnessStep * 4}px rgba(${colorRgb},${glowOpacity})`
                })()
              }}
            >
              LVL {level}
            </motion.span>
            <span className="px-2 py-1 rounded bg-accent-primary/20 text-accent-primary text-[10px] sm:text-xs font-orbitron border border-accent-primary/50">
              {totalXP} XP
            </span>
          </div>
          
          {/* XP Bar */}
          <div className="w-full max-w-md mx-auto sm:mx-0">
            <div className="flex justify-between text-[10px] sm:text-xs text-text-secondary mb-1 font-orbitron">
              <span>XP to Next Level</span>
              <span>{xpIntoLevel} / 100</span>
            </div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="h-2 bg-bg-dark rounded-full overflow-hidden border border-white/10 cursor-pointer group"
            >
              <motion.div 
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: isLevelingUp ? 1.2 : 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary shadow-[0_0_10px_rgba(217,70,239,0.5)] group-hover:shadow-[0_0_20px_rgba(217,70,239,0.8)] relative overflow-hidden transition-shadow"
              >
                <div className="absolute inset-0 bg-white/30 w-full animate-shimmer"></div>
                <motion.div
                  animate={isLevelingUp ? {
                    opacity: [0, 1, 1, 0],
                  } : {}}
                  transition={{ duration: 1.5, repeat: isLevelingUp ? 1 : 0 }}
                  className="absolute inset-0 bg-white/50"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Daily Streak */}
        <div className={`hidden sm:flex flex-col items-center justify-center px-5 py-3 rounded-xl border self-stretch transition-all ${
          streak.active
            ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
            : 'bg-white/5 border-white/10'
        }`}>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`w-7 h-7 mb-1 ${
              streak.active
                ? 'text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.9)] animate-[flicker_1.5s_ease-in-out_infinite]'
                : 'text-gray-600'
            }`}
          >
            <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.13-5.93 4-7.5.69-.58 1.65-.04 1.53.82C8.28 10.2 9.4 12 12 12c1.5 0 2.5-.84 3-2 .36-.84.64-2.05.5-3.5-.11-1.12 1.2-1.72 1.87-.87C19.57 8.73 21 11.47 21 15c0 4.42-4.03 8-9 8z" />
          </svg>
          <span className={`font-arcade text-lg ${streak.active ? 'text-amber-400' : 'text-gray-600'}`}>
            {streak.current_streak}
          </span>
          <span className={`font-orbitron text-[9px] uppercase tracking-wider ${streak.active ? 'text-amber-500/70' : 'text-gray-600'}`}>
            streak
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <StatCard 
          icon={Trophy} 
          label="Total Answers" 
          value={userProfile?.totalAnswers || 0} 
          color="accent-primary" 
        />
        <StatCard 
          icon={Flame} 
          label="Avg Score" 
          value={userProfile?.averageScore ? Math.round(userProfile.averageScore * 10) / 10 : '-'} 
          color="accent-secondary" 
        />
        <StatCard 
          icon={Star} 
          label="Best Category" 
          value={bestHighLevelCategory} 
          color="accent-tertiary" 
        />
      </div>

      {/* Daily Tasks */}
      <div className="w-full">
        <DailyTasks />
      </div>

      {/* Recent Activity */}
      <div 
        onClick={() => {
          dispatch(setActiveTab('history'))
          navigate('/')
        }}
        className="bg-bg-card/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 cursor-pointer group hover:border-white/20 transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-arcade text-base text-text-highlight flex items-center gap-2">
            <History className="w-5 h-5" /> Recent Activity
          </h2>
          <span className="text-xs text-text-muted group-hover:text-accent-primary transition-colors font-orbitron">View All →</span>
        </div>
        <div className="space-y-3">
          {history && history.length > 0 ? (
              history.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${entry.summary.score >= 7 ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <div className="flex flex-col">
                      <span className="text-sm text-text-primary">{entry.summary.subject}</span>
                      <span className="text-[10px] text-text-muted uppercase">{entry.summary.category} • {new Date(entry.summary.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`font-arcade text-sm ${entry.summary.score >= 7 ? 'text-green-400' : 'text-orange-400'}`}>
                    {String(entry.summary.score).includes('/') ? entry.summary.score : `${entry.summary.score}/10`}
                  </span>
              </div>
            ))
          ) : (
            <div className="text-center text-text-muted text-sm py-4 font-orbitron">
              No recent activity found. Start a quiz!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomeView
