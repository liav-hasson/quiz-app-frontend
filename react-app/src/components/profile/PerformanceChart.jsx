import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
// Dynamically import `recharts` to avoid bundling it into the main chunk.
import { fetchUserPerformance, selectPerformance, selectPerformanceLoading, selectPerformanceLoaded } from '@/store/slices/quizSlice'

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

export default function PerformanceChart() {
  const [performance, setPerformance] = useState(null)
  const [error, setError] = useState(null)
  const [hiddenCategories, setHiddenCategories] = useState({})
  const [Recharts, setRecharts] = useState(null)
  const dispatch = useDispatch()
  const perfFromStore = useSelector(selectPerformance)
  const perfLoading = useSelector(selectPerformanceLoading)
  const perfLoaded = useSelector(selectPerformanceLoaded)

  // Load performance via Redux thunk (no fallback to history)
  useEffect(() => {
    if (!perfLoaded && !perfLoading) {
      dispatch(fetchUserPerformance({ period: '30d', granularity: 'day' }))
    }
  }, [dispatch, perfLoaded, perfLoading])
  useEffect(() => {
    // Only use server-provided performance data from Redux store
    if (perfFromStore && perfFromStore.length) {
      setPerformance(perfFromStore)
    } else {
      setPerformance([])
    }
  }, [perfFromStore])

  // Dynamically load recharts only when this component mounts (Profile page)
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

  const chartData = useMemo(() => {
    if (!performance || performance.length === 0) return { data: [], categories: [] }
    // Collect all categories present
    const categorySet = new Set()
    performance.forEach((p) => {
      if (p.categories) Object.keys(p.categories).forEach((c) => categorySet.add(c))
    })
    const categories = Array.from(categorySet)

    // Build unified data points where each category has its own key
    const data = performance
      .slice(-15)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((p, idx) => {
        const obj = {
          name: formatDate(p.date) || `#${idx + 1}`,
          fullDate: p.date,
          overall: typeof p.overall === 'number' ? p.overall : (p.overall ? Number(p.overall) : 0),
        }
        categories.forEach((c) => {
          obj[c] = p.categories && p.categories[c] !== undefined ? p.categories[c] : null
        })
        return obj
      })

    return { data, categories }
  }, [performance])

  const toggleCategory = (cat) => {
    setHiddenCategories((s) => ({ ...s, [cat]: !s[cat] }))
  }

  // render UI: show spinner next to controls while loading; show placeholder in chart area when no data
  const noData = !chartData || chartData.data.length === 0

  const palette = [
    'var(--chart-color-1)',
    'var(--chart-color-2)',
    'var(--chart-color-3)',
    'var(--chart-color-4)',
    'var(--chart-color-5)',
    'var(--chart-color-6)',
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-md p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground">Overall: {p.overall}/10</p>
          {chartData.categories.map((c) => (
            p[c] !== null && p[c] !== undefined ? (
              <p key={c} className="text-xs text-muted-foreground mt-1">{c}: {p[c]}/10</p>
            ) : null
          ))}
          <p className="text-xs text-muted-foreground mt-1">{formatDate(p.fullDate)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div
            className="inline-flex items-center gap-2 px-2 py-1 text-sm rounded-md border"
            style={{ borderColor: 'var(--border)' }}
          >
            <span style={{ width: 12, height: 12, background: 'var(--chart-color-1)', display: 'inline-block', borderRadius: 2 }} />
            <span>Overall</span>
          </div>
          {chartData?.categories?.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCategory(c)}
              className={`inline-flex items-center gap-2 px-2 py-1 text-sm rounded-md border ${hiddenCategories[c] ? 'opacity-40' : ''}`}
              style={{ borderColor: 'var(--border)' }}
            >
              <span style={{ width: 12, height: 12, background: palette[(i + 1) % palette.length], display: 'inline-block', borderRadius: 2 }} />
              <span>{c}</span>
            </button>
          ))}
        </div>

        {perfLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span>Loading…</span>
          </div>
        )}
      </div>

      {noData ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {perfLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span>Loading performance data…</span>
            </div>
          ) : (
            <div>No score data available yet. Complete some quizzes to see your progress!</div>
          )}
        </div>
      ) : (
        // If recharts hasn't loaded yet, show a small placeholder while it's fetched
        !Recharts ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading chart library…</div>
        ) : (
          <Recharts.ResponsiveContainer width="100%" height={300}>
            <Recharts.LineChart data={chartData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <Recharts.CartesianGrid strokeDasharray="3 3" stroke="var(--accent-primary-light)" opacity={0.3} />
              <Recharts.XAxis dataKey="name" stroke="var(--text-secondary)" style={{ fontSize: '0.75rem' }} angle={-45} textAnchor="end" height={60} />
              <Recharts.YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke="var(--text-secondary)" style={{ fontSize: '0.75rem' }} />
              <Recharts.Tooltip content={<CustomTooltip />} />
              {/* overall line - always visible */}
              <Recharts.Line type="monotone" dataKey="overall" stroke="var(--chart-color-1)" strokeWidth={3} dot={{ r: 4 }} name="Overall" />

              {/* per-category lines */}
              {chartData.categories.map((c, i) => (
                !hiddenCategories[c] ? (
                  <Recharts.Line
                    key={c}
                    type="monotone"
                    dataKey={c}
                    stroke={palette[(i + 1) % palette.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={true}
                    name={c}
                  />
                ) : null
              ))}
            </Recharts.LineChart>
          </Recharts.ResponsiveContainer>
        )
      )}
    </div>
  )
}
