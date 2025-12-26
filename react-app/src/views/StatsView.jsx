import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { 
  fetchUserProfile, 
  fetchUserHistory,
  selectUserProfile,
  selectHistory,
  selectUserProfileLoading,
  selectHistoryLoading
} from '../store/slices/quizSlice'
import { CATEGORY_SECTIONS } from '../constants/categoryGroups'

const StatsView = () => {
  const dispatch = useDispatch()
  const profile = useSelector(selectUserProfile)
  const history = useSelector(selectHistory)
  const profileLoading = useSelector(selectUserProfileLoading)
  const historyLoading = useSelector(selectHistoryLoading)
  
  const [statsData, setStatsData] = useState([])

  useEffect(() => {
    dispatch(fetchUserHistory({ limit: 100 }))
    dispatch(fetchUserProfile())
  }, [dispatch])

  useEffect(() => {
    // Initialize scores for all sections
    const sectionScores = {}
    const sectionCounts = {}
    
    CATEGORY_SECTIONS.forEach(section => {
      sectionScores[section.id] = 0
      sectionCounts[section.id] = 0
    })

    // Calculate average scores from user history, grouped by section
    if (history && history.length > 0) {
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
    }

    // Build radar data with average scores (0-100 scale)
    const radarData = CATEGORY_SECTIONS.map(section => {
      const count = sectionCounts[section.id]
      const avgScore = count > 0 ? (sectionScores[section.id] / count) : 0
      return {
        subject: section.name,
        score: Math.round(avgScore * 10), // Convert 0-10 to 0-100 scale
        fullMark: 100,
      }
    })

    setStatsData(radarData)
  }, [history])

  const loading = profileLoading || historyLoading

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-arcade text-lg sm:text-2xl text-white">PERFORMANCE STATS</h1>
        <div className="text-left sm:text-right">
          <p className="text-[10px] sm:text-xs text-text-secondary font-orbitron">TOTAL XP</p>
          <p className="text-lg sm:text-xl font-arcade text-accent-primary">{profile?.XP?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="flex-1 h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)] md:h-[calc(100vh-200px)] min-h-[350px] sm:min-h-[400px] md:min-h-[500px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 h-full relative"
        >
          <h2 className="font-arcade text-[10px] sm:text-xs text-text-secondary mb-3 sm:mb-4 text-center">SKILL MATRIX</h2>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={statsData}>
              <defs>
                <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <PolarGrid stroke="#444" strokeWidth={0.5} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff', fontSize: 10, fontFamily: 'Press Start 2P' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="My Skills"
                dataKey="score"
                stroke="#00ff9d"
                strokeWidth={3}
                fill="#00ff9d"
                fillOpacity={0.5}
                style={{ filter: 'url(#neon-glow)' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121212', borderColor: '#00ff9d', borderRadius: '8px' }}
                itemStyle={{ color: '#00ff9d', fontFamily: 'Orbitron', fontSize: '12px' }}
                formatter={(value) => [`${value}%`, 'Avg Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}

export default StatsView
