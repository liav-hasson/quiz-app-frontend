import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/ThemeContext'

export default function Header({ user, onLogout }) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <header className="header-gradient fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-lg shadow-neon-pink/5">
      {/* Animated border gradient */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-turquoise-bright to-transparent opacity-50"
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
            className="relative"
          >
            <img
              src="/logo.svg"
              alt="Quiz Labs Logo"
              className="h-12 w-auto drop-shadow-lg contrast-125 brightness-125"
            />

            {/* Subtle pulsing aura effect */}
            <motion.div
              className="absolute -inset-4 rounded-lg blur-2xl -z-10 pointer-events-none"
              style={{
                background: `radial-gradient(circle, var(--accent-secondary-medium) 0%, var(--accent-primary-light) 50%, transparent 100%)`,
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
                  <motion.div
                    initial={{ borderColor: 'var(--accent-primary-light)' }}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary-strong)' }}
                  >
                    <img
                      src={user?.picture ?? '/default-avatar.png'}
                      alt={user?.name ?? user?.email ?? 'User avatar'}
                      className="w-6 h-6 rounded-full"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-sm font-medium text-soft-cyan">
                      {user.name || user.email}
                    </span>
                  </motion.div>

                  {/* Logout button */}
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    size="sm"
                    className="bg-dark-card/50 hover:bg-dark-card border-soft-cyan/30 hover:border-soft-cyan/50 text-soft-cyan"
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDark ? '☀️' : '🌙'}
                  </Button>

                  {/* Logout button */}
                  <Button
                    onClick={onLogout}
                    variant="outline"
                    size="sm"
                    className="bg-dark-card/50 hover:bg-dark-card border-neon-pink/30 hover:border-neon-pink/50 text-soft-cyan"
                  >
                    Logout
                  </Button>
                </>
              )}
              
              {!user && (
                <>
                  {/* Fun fact or tip */}
                  <motion.div
                    initial={{ borderColor: 'var(--accent-primary-light)' }}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary-strong)' }}
                  >
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="text-lg"
                    >
                      💡
                    </motion.span>
                    <span className="text-sm font-medium text-soft-cyan">
                      Test Your DevOps Skills
                    </span>
                  </motion.div>

                  {/* Status indicator */}
                  <motion.div
                    initial={{ borderColor: 'var(--accent-secondary-light)' }}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 bg-turquoise-bright/10 border border-turquoise-bright/30 rounded-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.05, borderColor: 'var(--accent-secondary-strong)' }}
                  >
                    <motion.span 
                      className="text-lg"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ⚡
                    </motion.span>
                    <span className="text-sm font-semibold text-soft-cyan">Ready</span>
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
