import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
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
          {/* Animated Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative header-logo cursor-pointer"
            onClick={() => navigate('/quiz')}
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
                      src={user?.picture ?? '/default-avatar.png'}
                      alt={user?.name ?? user?.email ?? 'User avatar'}
                      className="w-6 h-6 rounded-full"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span className="header-user-name">
                      {user.name || user.email}
                    </span>
                  </motion.button>

                  {/* Logout button */}
                  <Button
                    onClick={onLogout}
                    variant="outline"
                    size="sm"
                    className="header-logout-btn"
                  >
                    Logout
                  </Button>

                  {/* Theme toggle button - rightmost */}
                  <Button
                    onClick={handleToggleTheme}
                    variant="outline"
                    size="sm"
                    className="header-theme-btn"
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDark ? '☀️' : '🌙'}
                  </Button>
                </>
              )}
              
              {!user && (
                <>
                  {/* Fun fact or tip */}
                  <motion.div
                    initial={{ borderColor: 'var(--accent-primary-light)' }}
                    className="header-guest-badge"
                    whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary-strong)' }}
                  >
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="text-lg"
                    >
                      💡
                    </motion.span>
                    <span className="header-badge-text">
                      Test Your DevOps Skills
                    </span>
                  </motion.div>

                  {/* Status indicator */}
                  <motion.div
                    initial={{ borderColor: 'var(--accent-secondary-light)' }}
                    className="header-status-badge"
                    whileHover={{ scale: 1.05, borderColor: 'var(--accent-secondary-strong)' }}
                  >
                    <motion.span 
                      className="text-lg"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ⚡
                    </motion.span>
                    <span className="header-status-text">Ready</span>
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
