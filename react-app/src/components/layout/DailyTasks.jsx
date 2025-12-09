import React, { memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Target, Trophy, Check, Gift, Lock } from 'lucide-react'
import { selectDailyTasks, claimReward } from '../../store/slices/tasksSlice'
import { setActiveTab } from '../../store/slices/uiSlice'

const TaskItem = memo(function TaskItem({ task }) {
  const dispatch = useDispatch()
  const Icon = task.icon === 'Zap' ? Zap : task.icon === 'Target' ? Target : Trophy
  
  const handleClaim = (e) => {
    e.stopPropagation()
    if (task.completed && !task.claimed) {
      dispatch(claimReward(task.id))
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border p-3 sm:p-4 transition-all ${
        task.claimed 
          ? 'bg-white/5 border-white/5 opacity-60' 
          : task.completed 
            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
            : 'bg-bg-card/50 border-white/10'
      }`}
    >
      {/* Shimmer effect for completed tasks */}
      {task.completed && !task.claimed && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '200%', opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent -skew-x-12 pointer-events-none z-0"
        />
      )}
      
      <div className="flex items-start justify-between gap-3 sm:gap-4 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${
            task.completed ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-text-secondary'
          }`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className={`font-arcade text-xs sm:text-sm truncate ${task.completed ? 'text-green-400' : 'text-white'}`}>
              {task.title}
            </h3>
            <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5 sm:mt-1 line-clamp-2">{task.description}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
          <span className="text-[10px] sm:text-xs font-orbitron text-accent-primary whitespace-nowrap">+{task.xpReward} XP</span>
          {task.claimed ? (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-green-500 font-orbitron">
              <Check className="w-3 h-3" /> CLAIMED
            </span>
          ) : task.completed ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClaim}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500 hover:bg-green-400 text-black text-[10px] sm:text-xs font-bold rounded-lg font-orbitron shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse"
            >
              <Gift className="w-3 h-3" /> CLAIM
            </motion.button>
          ) : (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-text-muted font-orbitron">
              <Lock className="w-3 h-3" /> {task.progress}/{task.target}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})

const DailyTasks = memo(function DailyTasks() {
  const tasks = useSelector(selectDailyTasks)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleContainerClick = () => {
    dispatch(setActiveTab('play'))
    navigate('/')
  }

  return (
    <div 
      onClick={handleContainerClick}
      className="bg-bg-card/50 backdrop-blur-md rounded-2xl border border-white/5 p-4 sm:p-6 pb-2 sm:pb-3 cursor-pointer group hover:border-white/20 transition-all"
    >
      <h2 className="font-arcade text-sm sm:text-base text-text-highlight mb-3 sm:mb-4 flex items-center gap-2">
        <Target className="w-4 h-4 sm:w-5 sm:h-5" /> Daily Missions
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
})

export default DailyTasks
