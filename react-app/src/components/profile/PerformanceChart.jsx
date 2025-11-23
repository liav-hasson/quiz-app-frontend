import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export default function PerformanceChart({ history }) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return []

    // Sort by date (oldest first) and take last 15 entries
    const sortedHistory = [...history]
      .filter(entry => entry?.summary?.created_at && entry?.summary?.score !== undefined)
      .sort((a, b) => {
        const dateA = new Date(a.summary.created_at)
        const dateB = new Date(b.summary.created_at)
        return dateA - dateB
      })
      .slice(-15) // Take last 15 entries

    return sortedHistory.map((entry, index) => {
      const score = parseScoreValue(entry.summary.score)
      const date = formatDate(entry.summary.created_at)
      
      return {
        name: date || `#${index + 1}`,
        score: score !== null ? score : 0,
        fullDate: entry.summary.created_at,
      }
    })
  }, [history])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No score data available yet. Complete some quizzes to see your progress!
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground">
            Score: {payload[0].value}/10
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(payload[0].payload.fullDate)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-primary-light)" opacity={0.3} />
        <XAxis 
          dataKey="name" 
          stroke="var(--text-secondary)"
          style={{ fontSize: '0.75rem' }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          domain={[0, 10]} 
          ticks={[0, 2, 4, 6, 8, 10]}
          stroke="var(--text-secondary)"
          style={{ fontSize: '0.75rem' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ 
            fontSize: '0.875rem',
            color: 'var(--text-primary)'
          }} 
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--accent-secondary)"
          strokeWidth={3}
          dot={{ fill: 'var(--accent-secondary)', strokeWidth: 2, r: 5 }}
          activeDot={{ r: 7, fill: 'var(--accent-quaternary)' }}
          name="Score"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
