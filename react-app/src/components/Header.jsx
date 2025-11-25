import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toggleTheme, selectIsDark } from '@/store/slices/themeSlice'

export default function Header({ user, onLogout, onProfileClick }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isDark = useSelector(selectIsDark)

  const handleToggleTheme = () => {
    dispatch(toggleTheme())
  }

  const handleProfileClick = () => {
    if (typeof onProfileClick === 'function') {
      onProfileClick()
    }
  }

  const handleLogout = () => {
    if (typeof onLogout === 'function') {
      onLogout()
    }
  }

  return (
    <header className="header-base">
      {/* Animated border gradient */}
      <motion.div
        className="header-border-line"
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="container mx-auto px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          {/* Logo - Links to home/quiz */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative header-logo cursor-pointer"
            onClick={() => navigate(user ? '/quiz' : '/login')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src="/assets/Quizlabs-Full-BW.svg"
              alt="Quiz Labs Logo"
            />

            {/* Subtle pulsing aura effect */}
            <motion.div
              className="absolute -inset-4 rounded-lg blur-2xl -z-10 pointer-events-none"
              style={{
                background: `radial-gradient(circle, var(--accent-quinary-medium) 0%, var(--accent-tertiary-light) 50%, transparent 100%)`,
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Right side - Stats or Actions */}
          <div className="ml-auto flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3"
            >
              {user && (
                <>
                  {/* User info */}
                  <motion.button
                    type="button"
                    initial={{ borderColor: 'var(--accent-primary-light)' }}
                    className="header-user-badge"
                    whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary-strong)' }}
                    onClick={handleProfileClick}
                    aria-label={`View profile for ${user.name || user.email}`}
                  >
                    <img
                      src={user?.picture ?? '/assets/Quizlabs-Icon.svg'}
                      alt={user?.name ?? user?.email ?? 'User avatar'}
                      className="w-6 h-6 rounded-full"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span className="header-user-name">
                      {user.name || user.email}
                    </span>
                  </motion.button>

                  {/* Theme toggle button */}
                  <Button
                    onClick={handleToggleTheme}
                    variant="outline"
                    size="sm"
                    className="header-theme-btn"
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDark ? 'Light' : 'Dark'}
                  </Button>

                  {/* Burger Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xl"
                        aria-label="Menu"
                      >
                        ☰
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-card">
                      <DropdownMenuItem onClick={() => navigate('/quiz')}>
                        Quiz
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleProfileClick}>
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/leaderboard')}>
                        Leaderboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              
              {!user && (
                <>
                  {/* Login button */}
                  <Button
                    onClick={() => navigate('/login')}
                    variant="outline"
                    size="sm"
                    className="header-logout-btn"
                  >
                    Login
                  </Button>

                  {/* Theme toggle button */}
                  <Button
                    onClick={handleToggleTheme}
                    variant="outline"
                    size="sm"
                    className="header-theme-btn"
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDark ? 'Light' : 'Dark'}
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
