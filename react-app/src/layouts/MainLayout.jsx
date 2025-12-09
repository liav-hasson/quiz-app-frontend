import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Users } from 'lucide-react'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import { toggleMobileMenu, selectIsMobileMenuOpen, selectAnimatedBackground, selectActiveTab, selectSelectedHistoryItem } from '../store/slices/uiSlice'
import { selectIsInLobby, selectCurrentLobbyCode } from '../store/slices/lobbySlice'
import PsychedelicSpiral from '../components/ui/PsychedelicSpiral'
import { LobbyChatProvider, useLobbyChatContext } from '../contexts/LobbyChatContext'

// Memoize background to prevent re-mounting on parent re-renders
const BackgroundEffects = React.memo(({ animatedBackground }) => {
  if (animatedBackground) {
    return (
      <PsychedelicSpiral
        className="fixed inset-0 z-0 pointer-events-none"
        spinRotation={-0.3}
        spinSpeed={1.5}
        color1="#050505"
        color2="#0f0f0f"
        color3="#1a1a1a"
        contrast={2.5}
        lighting={0.4}
        spinAmount={0.2}
        pixelFilter={500}
        isRotate={true}
      />
    )
  }
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/10 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-10s' }} />
      <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-[0.03]" />
    </div>
  )
})

const MainLayoutContent = ({ children }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobileMenuOpen = useSelector(selectIsMobileMenuOpen)
  const animatedBackground = useSelector(selectAnimatedBackground)
  const activeTab = useSelector(selectActiveTab)
  const selectedHistoryItem = useSelector(selectSelectedHistoryItem)
  const lobbyChatContext = useLobbyChatContext()
  
  // Lobby state from Redux
  const isInLobby = useSelector(selectIsInLobby)
  const currentLobbyCode = useSelector(selectCurrentLobbyCode)
  const isOnLobbyPage = location.pathname.startsWith('/lobby')
  const isOnBattlePage = location.pathname.startsWith('/battle')
  const showLobbyBanner = isInLobby && currentLobbyCode && !isOnLobbyPage && !isOnBattlePage

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary overflow-hidden flex relative">
      {/* Background Effects - Memoized to prevent reset on re-renders */}
      <BackgroundEffects animatedBackground={animatedBackground} />

      {/* Lobby Indicator Banner - Shows when user is in a lobby but not on lobby page */}
      <AnimatePresence>
        {showLobbyBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 backdrop-blur-md border-b border-accent-primary/30 z-50 flex items-center justify-center cursor-pointer hover:from-accent-primary/30 hover:to-accent-secondary/30 transition-all"
            onClick={() => navigate(`/lobby/${currentLobbyCode}`)}
          >
            <div className="flex items-center gap-2 text-sm font-orbitron">
              <Users className="w-4 h-4 text-accent-primary" />
              <span className="text-text-primary">You're in lobby</span>
              <span className="font-arcade text-accent-primary">{currentLobbyCode}</span>
              <span className="text-text-muted">• Click to return</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <div className={`lg:hidden fixed left-0 right-0 h-16 bg-bg-card/90 backdrop-blur-md border-b border-white/10 z-40 flex items-center justify-between px-4 ${showLobbyBanner ? 'top-12' : 'top-0'}`}>
        <div className="flex items-center gap-2" onClick={() => dispatch(toggleMobileMenu())}>
          <h1 className="font-arcade text-xl tracking-tighter flex">
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
        <button 
          onClick={() => dispatch(toggleMobileMenu())}
          className="p-2 text-text-secondary hover:text-text-primary"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(toggleMobileMenu())}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-50 lg:hidden"
            >
              <LeftSidebar className="w-full h-full shadow-2xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Layout Grid */}
      <div className={`flex-1 grid grid-cols-1 lg:grid-cols-12 h-screen z-10 relative ${showLobbyBanner ? 'pt-[4.75rem] lg:pt-12' : 'pt-16 lg:pt-0'}`}>
        
        {/* Left Column - Navigation (Hidden on Mobile, handled by Drawer) */}
        <div className="hidden lg:block lg:col-span-2 xl:col-span-2 h-full">
          <LeftSidebar />
        </div>

        {/* Center Column - Main Stage */}
        <main className="col-span-1 lg:col-span-7 xl:col-span-7 h-full overflow-y-auto custom-scrollbar relative flex flex-col">
          <div className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full">
            {/* Logic to prevent double rendering of children */}
            {(() => {
              const isPlayRoute = location.pathname === '/play'
              const isHistorySelected = !!selectedHistoryItem
              const isSidebarTab = ['play', 'multiplayer', 'history', 'settings'].includes(activeTab)
              const isInLobby = location.pathname.startsWith('/lobby')
              
              // On mobile, we show the sidebar if a sidebar tab is active AND we are not in a "main" view (play/history detail)
              // EXCEPT when in lobby - show lobby content, not chat
              const showMobileSidebar = isSidebarTab && !isPlayRoute && !isHistorySelected && !isInLobby

              if (showMobileSidebar) {
                return (
                  <>
                    {/* Mobile: Show Sidebar */}
                    <div className="lg:hidden block">
                      <RightSidebar className="w-full border-none bg-transparent" />
                    </div>
                    {/* Desktop: Show Children (hidden on mobile) */}
                    <div className="hidden lg:block">
                      {children}
                    </div>
                  </>
                )
              }

              // Otherwise, we show children (visible on both mobile and desktop)
              return children
            })()}
          </div>
        </main>

        {/* Right Column - Game Init / Lobby / Chat */}
        <div className="hidden lg:block lg:col-span-3 xl:col-span-3 h-full">
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}

const MainLayout = ({ children }) => {
  return (
    <LobbyChatProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </LobbyChatProvider>
  )
}

export default MainLayout
