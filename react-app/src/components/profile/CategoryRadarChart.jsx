import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectHistory } from '@/store/slices/quizSlice'

export default function CategoryRadarChart() {
  const [Recharts, setRecharts] = useState(null)
  const history = useSelector(selectHistory)

  // Dynamically load recharts
  useEffect(() => {
    let mounted = true
    import('recharts')
      .then((mod) => {
        if (mounted) setRecharts(mod)
      })
      .catch(() => {
        if (mounted) setRecharts(null)
      })
    return () => {
      mounted = false
    }
  }, [])

  const categoryData = useMemo(() => {
    if (!history || history.length === 0) return []

    // Group by category and calculate average score
    const categoryScores = {}
    const categoryCounts = {}

    history.forEach((entry) => {
      const category = entry?.summary?.category
      const score = entry?.summary?.score

      if (category && typeof score === 'number') {
        if (!categoryScores[category]) {
          categoryScores[category] = 0
          categoryCounts[category] = 0
        }
        categoryScores[category] += score
        categoryCounts[category] += 1
      }
    })

    // Calculate averages and format for radar chart
    return Object.keys(categoryScores).map((category) => ({
      category,
      score: Math.round((categoryScores[category] / categoryCounts[category]) * 10) / 10,
      fullMark: 10,
    }))
  }, [history])

  const noData = !categoryData || categoryData.length === 0

  if (noData) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        <div>No category data available yet. Complete some quizzes to see your knowledge radar!</div>
      </div>
    )
  }

  if (!Recharts) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        Loading chart library…
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <Recharts.ResponsiveContainer width="100%" height={500}>
        <Recharts.RadarChart data={categoryData} cx="50%" cy="50%">
        <Recharts.PolarGrid stroke="var(--border)" />
        <Recharts.PolarAngleAxis 
          dataKey="category" 
          stroke="var(--text-secondary)" 
          style={{ fontSize: '0.875rem' }}
        />
        <Recharts.PolarRadiusAxis 
          angle={90} 
          domain={[0, 10]} 
          stroke="var(--text-secondary)"
          style={{ fontSize: '0.75rem' }}
        />
        <Recharts.Radar
          name="Knowledge"
          dataKey="score"
          stroke="var(--chart-color-1)"
          fill="var(--chart-color-1)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Recharts.Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-card border border-border rounded-md p-3 shadow-lg">
                  <p className="text-sm font-semibold text-foreground">
                    {payload[0].payload.category}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average Score: {payload[0].value}/10
                  </p>
                </div>
              )
            }
            return null
          }}
        />
      </Recharts.RadarChart>
    </Recharts.ResponsiveContainer>
    </div>
  )
}
