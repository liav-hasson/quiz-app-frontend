import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, BookOpen, Zap, CheckCircle, ArrowLeft } from 'lucide-react'
import { getDailyDeepDive, claimDeepDiveXP } from '../api/quizAPI'
import { selectSelectedDeepDiveArticle, setSelectedDeepDiveArticle } from '../store/slices/uiSlice'
import MarkdownRenderer from '../components/common/MarkdownRenderer'

const DailyDeepDiveView = () => {
  const dispatch = useDispatch()
  const selectedArchiveArticle = useSelector(selectSelectedDeepDiveArticle)

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [xpClaimed, setXpClaimed] = useState(false)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getDailyDeepDive()
        if (data.status === 'generating') {
          setGenerating(true)
          setLoading(false)
          return
        }
        if (!data.ok && data.status !== 'ready') throw new Error(data.error || 'Failed to load daily deep dive')
        setArticle(data)
        setXpClaimed(data.xp_claimed || false)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Poll while article is being generated
  useEffect(() => {
    if (!generating) return
    const interval = setInterval(async () => {
      try {
        const data = await getDailyDeepDive()
        if (data.status === 'ready') {
          setArticle(data)
          setXpClaimed(data.xp_claimed || false)
          setGenerating(false)
        }
      } catch {
        // keep polling
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [generating])

  const handleClaimXP = async () => {
    if (claiming || xpClaimed) return
    setClaiming(true)
    try {
      const res = await claimDeepDiveXP()
      if (res.ok || res.status === 200) {
        setXpClaimed(true)
      } else if (res.status === 409) {
        setXpClaimed(true)
      }
    } catch {
      // Silently handle — user can retry
    } finally {
      setClaiming(false)
    }
  }

  // Show selected archive article (clicked from RightSidebar)
  if (selectedArchiveArticle) {
    return (
      <div className="max-w-3xl mx-auto w-full pb-20 space-y-6">
        <button
          onClick={() => dispatch(setSelectedDeepDiveArticle(null))}
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors font-orbitron text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Today's Article
        </button>

        <div className="flex flex-wrap items-center gap-3 text-xs font-orbitron">
          <span className="text-text-muted">{selectedArchiveArticle.date}</span>
        </div>

        <div className="bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50" />
          <div className="text-text-primary font-sans text-base leading-relaxed">
            <MarkdownRenderer content={selectedArchiveArticle.content} />
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-rose-400 animate-spin mb-4" />
        <p className="font-orbitron text-text-secondary animate-pulse">LOADING DEEP DIVE...</p>
      </div>
    )
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Loader2 className="w-16 h-16 text-rose-400 animate-spin mb-6" />
        <h2 className="font-arcade text-lg text-rose-400 mb-3">GENERATING ARTICLE</h2>
        <p className="text-text-secondary font-orbitron text-xs max-w-sm animate-pulse">
          This may take 10-20 seconds...
        </p>
      </div>
    )
  }

  if (error && !article) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="font-arcade text-xl text-white mb-2">SYSTEM ERROR</h2>
        <p className="text-text-secondary mb-6 max-w-md">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto w-full pb-20 space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/20 border border-rose-500/50 mb-4"
        >
          <BookOpen className="w-5 h-5 text-rose-400" />
          <span className="font-arcade text-sm text-rose-400">DAILY DEEP DIVE</span>
        </motion.div>
      </div>

      {/* Date */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center text-xs font-orbitron"
      >
        <span className="text-text-muted">{article?.date}</span>
      </motion.div>

      {/* Article */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
        <div className="text-text-primary font-sans text-base leading-relaxed">
          <MarkdownRenderer content={article?.content} />
        </div>
      </motion.div>

      {/* Claim XP Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <motion.button
          whileHover={!xpClaimed ? { scale: 1.05 } : {}}
          whileTap={!xpClaimed ? { scale: 0.95 } : {}}
          onClick={handleClaimXP}
          disabled={xpClaimed || claiming}
          className={`px-8 py-3 rounded-xl font-arcade text-sm flex items-center gap-2 transition-all ${
            xpClaimed
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-default'
              : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)]'
          }`}
        >
          {claiming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : xpClaimed ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>+{article?.xp_reward || 25} XP CLAIMED</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>CLAIM +{article?.xp_reward || 25} XP</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}

export default DailyDeepDiveView
