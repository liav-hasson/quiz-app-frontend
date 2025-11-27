import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { BookOpen, TrendingUp, Target } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { selectHistory, selectUserProfile } from '@/store/slices/quizSlice'

/**
 * StudyRecommendations - Suggests topics/categories for improvement
 * 
 * Analyzes user performance across categories and suggests areas to focus on.
 * Shows weakest categories and provides actionable recommendations.
 */
export default function StudyRecommendations() {
  const history = useSelector(selectHistory)
  const userProfile = useSelector(selectUserProfile)

  const recommendations = useMemo(() => {
    if (!history.length) {
      return []
    }

    // Calculate performance by category
    const categoryStats = {}
    
    history.forEach((entry) => {
      const category = entry?.summary?.category || entry?.details?.metadata?.category
      const score = entry?.summary?.score
      
      if (!category || typeof score !== 'number') return
      
      if (!categoryStats[category]) {
        categoryStats[category] = {
          category,
          totalScore: 0,
          count: 0,
          scores: [],
        }
      }
      
      categoryStats[category].totalScore += score
      categoryStats[category].count += 1
      categoryStats[category].scores.push(score)
    })

    // Calculate averages and find weakest categories
    const categoryPerformance = Object.values(categoryStats)
      .map((stat) => ({
        category: stat.category,
        averageScore: stat.totalScore / stat.count,
        count: stat.count,
        trend: calculateTrend(stat.scores),
      }))
      .filter((cat) => cat.count >= 2) // Only show categories with at least 2 attempts
      .sort((a, b) => a.averageScore - b.averageScore)

    // Generate recommendations based on performance
    const recs = []

    // Weakest category (if below 7/10 average)
    if (categoryPerformance.length > 0 && categoryPerformance[0].averageScore < 7) {
      recs.push({
        type: 'weak',
        category: categoryPerformance[0].category,
        score: categoryPerformance[0].averageScore,
        message: `Your average score in ${categoryPerformance[0].category} is ${categoryPerformance[0].averageScore.toFixed(1)}/10. Consider reviewing this topic.`,
        icon: Target,
      })
    }

    // Declining trend
    const decliningCategories = categoryPerformance.filter(
      (cat) => cat.trend === 'declining' && cat.count >= 3
    )
    if (decliningCategories.length > 0) {
      recs.push({
        type: 'declining',
        category: decliningCategories[0].category,
        message: `Your performance in ${decliningCategories[0].category} has been declining. Time for a refresher!`,
        icon: TrendingUp,
      })
    }

    // Need more practice (low attempt count)
    const underPracticedCategories = categoryPerformance.filter(
      (cat) => cat.count < 5
    )
    if (underPracticedCategories.length > 0) {
      const randomIndex = Math.floor(Math.random() * underPracticedCategories.length)
      recs.push({
        type: 'practice',
        category: underPracticedCategories[randomIndex].category,
        message: `Only ${underPracticedCategories[randomIndex].count} attempt(s) in ${underPracticedCategories[randomIndex].category}. Try more questions to build mastery!`,
        icon: BookOpen,
      })
    }

    // If user has strong performance everywhere, suggest exploring new areas
    if (recs.length === 0 && categoryPerformance.length > 0) {
      const strongestCategory = categoryPerformance[categoryPerformance.length - 1]
      if (strongestCategory.averageScore >= 8) {
        recs.push({
          type: 'explore',
          category: 'New Topics',
          message: `Great work! You're excelling in ${strongestCategory.category}. Try exploring new categories to expand your knowledge.`,
          icon: BookOpen,
        })
      }
    }

    return recs.slice(0, 3) // Limit to top 3 recommendations
  }, [history])

  // Helper function to calculate trend
  function calculateTrend(scores) {
    if (scores.length < 3) return 'stable'
    
    const recentScores = scores.slice(-3)
    const olderScores = scores.slice(0, -3)
    
    if (olderScores.length === 0) return 'stable'
    
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length
    
    if (recentAvg > olderAvg + 0.5) return 'improving'
    if (recentAvg < olderAvg - 0.5) return 'declining'
    return 'stable'
  }

  if (!recommendations.length) {
    return (
      <Card className="profile-card recommendations-card">
        <CardHeader>
          <CardTitle className="recommendations-title">
            <BookOpen className="recommendations-title-icon" size={24} />
            Study Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="recommendations-empty">
            <p>Complete more quiz questions to receive personalized study recommendations!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="profile-card recommendations-card">
      <CardHeader>
        <CardTitle className="recommendations-title">
          <BookOpen className="recommendations-title-icon" size={24} />
          Study Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="recommendations-list">
          {recommendations.map((rec, index) => {
            const Icon = rec.icon
            return (
              <motion.div
                key={index}
                className="recommendation-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="recommendation-icon-container">
                  <Icon className="recommendation-icon" size={20} />
                </div>
                <div className="recommendation-content">
                  <div className="recommendation-header">
                    <Badge 
                      variant="secondary" 
                      className="recommendation-badge"
                    >
                      {rec.category}
                    </Badge>
                    {rec.type === 'weak' && (
                      <span className="recommendation-score">
                        {rec.score.toFixed(1)}/10
                      </span>
                    )}
                  </div>
                  <p className="recommendation-message">{rec.message}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
