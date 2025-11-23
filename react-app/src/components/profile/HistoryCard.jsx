import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const DIFFICULTY_MAP = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
}

const formatDate = (value) => {
  if (!value) return 'Unknown time'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time'
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function HistoryCard({ entry, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const summary = entry?.summary ?? {}
  const details = entry?.details ?? {}

  const scoreLabel = useMemo(() => {
    if (summary.score === null || summary.score === undefined) {
      return 'Pending'
    }
    if (typeof summary.score === 'number') {
      return `${summary.score}/10`
    }
    return summary.score
  }, [summary.score])

  const difficultyLabel = DIFFICULTY_MAP[summary.difficulty] || 'Unknown'

  const evaluationText = details.evaluation?.feedback || 'AI feedback will appear here once available.'
  const metadataEntries = Object.entries(details.metadata || {})

  return (
    <motion.article
      className="history-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        type="button"
        className="history-card-header"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} history details for ${summary.category || 'Unknown Topic'} - ${summary.subject || 'Unknown Subject'}`}
      >
        <div>
          <p className="history-card-title">
            {summary.category || 'Unknown Topic'} • {summary.subject || 'Unknown Subject'}
          </p>
          <span className="history-card-date">{formatDate(summary.created_at)}</span>
        </div>
        <div className="history-card-meta">
          <Badge variant="secondary" className="history-meta-pill">
            {difficultyLabel}
          </Badge>
          <Badge variant="outline" className="history-meta-pill">
            {scoreLabel}
          </Badge>
          <span className="history-card-chevron" aria-hidden="true">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="history-card-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="history-body-section">
              <p className="history-body-label">Question</p>
              <p className="history-body-value">{details.question || 'Unknown question'}</p>
            </div>
            <Separator className="history-body-separator" />
            <div className="history-body-section">
              <p className="history-body-label">Your Answer</p>
              <p className="history-body-value">{details.answer || 'No answer recorded.'}</p>
            </div>
            <Separator className="history-body-separator" />
            <div className="history-body-section">
              <p className="history-body-label">AI Feedback</p>
              <p className="history-body-value whitespace-pre-wrap">{evaluationText}</p>
            </div>
            {!!metadataEntries.length && (
              <>
                <Separator className="history-body-separator" />
                <div className="history-body-section">
                  <p className="history-body-label">Metadata</p>
                  <div className="history-metadata-grid">
                    {metadataEntries.map(([key, value]) => (
                      <span key={key} className="history-metadata-chip">
                        <strong>{key}:</strong> {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
