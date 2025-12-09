import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  Home, 
  Play, 
  Users, 
  BarChart2, 
  History, 
  Settings, 
  LogOut,
  Menu
} from 'lucide-react'
import { motion } from 'framer-motion'
import { logout } from '../../store/slices/authSlice'
import { setActiveTab, selectActiveTab, toggleMobileMenu, closeMobileMenu } from '../../store/slices/uiSlice'

const MenuItem = ({ icon: Icon, label, id, isActive, onClick, colorClass, hoverClass, shadowClass, bgClass }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, x: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3.5 sm:py-3 rounded-xl transition-all duration-200 group relative overflow-hidden min-h-[48px]
        ${isActive 
          ? `bg-white/5 ${colorClass} ${shadowClass} border border-white/10` 
          : `text-text-secondary hover:bg-white/5 ${hoverClass}`
        }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className={`absolute left-0 top-0 bottom-0 w-1 ${bgClass} shadow-[0_0_10px_currentColor]`}
        />
      )}
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${isActive ? `drop-shadow-[0_0_5px_currentColor]` : ''}`} />
      <span className={`font-orbitron font-medium tracking-wide text-sm sm:text-base ${isActive ? 'text-shadow-neon' : ''}`}>
        {label}
      </span>
    </motion.button>
  )
}

const LeftSidebar = ({ className = '' }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const activeTab = useSelector(selectActiveTab)

  const handleNavigation = (tab) => {
    dispatch(setActiveTab(tab))
    dispatch(closeMobileMenu()) // Auto-close mobile menu on navigation
    if (tab === 'home') navigate('/')
    if (tab === 'play') navigate('/') // Stay on home, RightSidebar handles setup
    if (tab === 'multiplayer') navigate('/') // Stay on home, RightSidebar handles lobby
    if (tab === 'stats') navigate('/stats')
    if (tab === 'history') navigate('/')
    if (tab === 'settings') navigate('/')
  }

  const handleLogout = () => {
    dispatch(closeMobileMenu())
    dispatch(logout())
    navigate('/login')
  }

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, colorClass: 'text-cyan-400', bgClass: 'bg-cyan-400', hoverClass: 'hover:text-cyan-400', shadowClass: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]' },
    { id: 'play', label: 'Play', icon: Play, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400', hoverClass: 'hover:text-emerald-400', shadowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' },
    { id: 'multiplayer', label: 'Multiplayer', icon: Users, colorClass: 'text-fuchsia-400', bgClass: 'bg-fuchsia-400', hoverClass: 'hover:text-fuchsia-400', shadowClass: 'shadow-[0_0_15px_rgba(217,70,239,0.3)]' },
    { id: 'stats', label: 'Stats', icon: BarChart2, colorClass: 'text-yellow-400', bgClass: 'bg-yellow-400', hoverClass: 'hover:text-yellow-400', shadowClass: 'shadow-[0_0_15px_rgba(250,204,21,0.3)]' },
    { id: 'history', label: 'History', icon: History, colorClass: 'text-orange-400', bgClass: 'bg-orange-400', hoverClass: 'hover:text-orange-400', shadowClass: 'shadow-[0_0_15px_rgba(251,146,60,0.3)]' },
    { id: 'settings', label: 'Settings', icon: Settings, colorClass: 'text-slate-400', bgClass: 'bg-slate-400', hoverClass: 'hover:text-slate-400', shadowClass: 'shadow-[0_0_15px_rgba(148,163,184,0.3)]' },
  ]

  return (
    <aside className={`flex flex-col h-full bg-bg-card/80 backdrop-blur-md border-r border-white/10 ${className}`}>
      {/* Logo Area */}
      <div className="p-4 sm:p-6 flex items-center justify-center cursor-pointer" onClick={() => handleNavigation('home')}>
        <h1 className="font-arcade text-lg sm:text-xl tracking-tighter flex">
          {"QuizLabs".split('').map((char, index) => (
            <span 
              key={index} 
              className="animate-neon-cycle hover:animate-none hover:text-white transition-colors"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {char}
            </span>
          ))}
        </h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <MenuItem
            key={item.id}
            {...item}
            isActive={activeTab === item.id}
            onClick={() => handleNavigation(item.id)}
          />
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 sm:p-4 border-t border-white/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-orbitron text-sm">LOGOUT</span>
        </motion.button>
      </div>
    </aside>
  )
}

export default LeftSidebar
