import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
<<<<<<< HEAD
import { colorsRGBA } from '@/lib/colors'
import { useTheme } from '@/context/ThemeContext'

// Motion prop color constants
const headerMotionColors = {
  neonPinkLight: colorsRGBA.neonPink(0.18),
  neonPinkStrong: colorsRGBA.neonPink(0.5),
  turquoiseBrightLight: colorsRGBA.turquoiseBright(0.18),
  turquoiseBrightStrong: colorsRGBA.turquoiseBright(0.5),
}
=======
import { useTheme } from '@/context/ThemeContext'
>>>>>>> 24d7d98 (theme changes)

export default function Header({ user, onLogout }) {
  const { isDark, toggleTheme } = useTheme()
  return (
<<<<<<< HEAD
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-card/90 backdrop-blur-md border-b border-turquoise-bright/20 shadow-lg shadow-neon-pink/5">
=======
    <header className="header-gradient fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-lg shadow-neon-pink/5">
>>>>>>> 24d7d98 (theme changes)
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
<<<<<<< HEAD
                background: `radial-gradient(circle, ${colorsRGBA.turquoiseBright(0.3)} 0%, ${colorsRGBA.neonPink(0.2)} 50%, transparent 100%)`,
=======
                background: `radial-gradient(circle, var(--accent-secondary-medium) 0%, var(--accent-primary-light) 50%, transparent 100%)`,
>>>>>>> 24d7d98 (theme changes)
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
<<<<<<< HEAD
                    initial={{ borderColor: 'rgba(247, 37, 133, 0.18)' }}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.02, borderColor: 'rgba(247, 37, 133, 0.5)' }}
=======
                    initial={{ borderColor: 'var(--accent-primary-light)' }}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary-strong)' }}
>>>>>>> 24d7d98 (theme changes)
                  >
                    <img
                      src={user?.picture ?? '/default-avatar.png'}
                      alt={user?.name ?? user?.email ?? 'User avatar'}
                      className="w-6 h-6 rounded-full"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
<<<<<<< HEAD
                    <span className="text-soft-cyan text-sm font-medium">
=======
                    <span className="text-sm font-medium text-soft-cyan">
>>>>>>> 24d7d98 (theme changes)
                      {user.name || user.email}
                    </span>
                  </motion.div>

                  {/* Logout button */}
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    size="sm"
<<<<<<< HEAD
                    className="bg-dark-card/50 hover:bg-dark-card text-soft-cyan border-soft-cyan/30 hover:border-soft-cyan/50"
=======
                    className="bg-dark-card/50 hover:bg-dark-card border-soft-cyan/30 hover:border-soft-cyan/50 text-soft-cyan"
>>>>>>> 24d7d98 (theme changes)
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDark ? '☀️' : '🌙'}
                  </Button>

                  {/* Logout button */}
                  <Button
                    onClick={onLogout}
                    variant="outline"
                    size="sm"
<<<<<<< HEAD
                    className="bg-dark-card/50 hover:bg-dark-card text-soft-cyan border-neon-pink/30 hover:border-neon-pink/50"
=======
                    className="bg-dark-card/50 hover:bg-dark-card border-neon-pink/30 hover:border-neon-pink/50 text-soft-cyan"
>>>>>>> 24d7d98 (theme changes)
                  >
                    Logout
                  </Button>
                </>
              )}
              
              {!user && (
                <>
                  {/* Fun fact or tip */}
                  <motion.div
<<<<<<< HEAD
                    initial={{ borderColor: headerMotionColors.neonPinkLight }}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.02, borderColor: headerMotionColors.neonPinkStrong }}
=======
                    initial={{ borderColor: 'var(--accent-primary-light)' }}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary-strong)' }}
>>>>>>> 24d7d98 (theme changes)
                  >
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="text-lg"
                    >
                      💡
                    </motion.span>
<<<<<<< HEAD
                    <span className="text-soft-cyan text-sm font-medium">
=======
                    <span className="text-sm font-medium text-soft-cyan">
>>>>>>> 24d7d98 (theme changes)
                      Test Your DevOps Skills
                    </span>
                  </motion.div>

                  {/* Status indicator */}
                  <motion.div
<<<<<<< HEAD
                    initial={{ borderColor: headerMotionColors.turquoiseBrightLight }}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 bg-turquoise-bright/10 border border-turquoise-bright/30 rounded-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.05, borderColor: headerMotionColors.turquoiseBrightStrong }}
                  >
                    <motion.span 
                      className="text-turquoise-bright text-lg"
=======
                    initial={{ borderColor: 'var(--accent-secondary-light)' }}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 bg-turquoise-bright/10 border border-turquoise-bright/30 rounded-lg backdrop-blur-sm"
                    whileHover={{ scale: 1.05, borderColor: 'var(--accent-secondary-strong)' }}
                  >
                    <motion.span 
                      className="text-lg"
>>>>>>> 24d7d98 (theme changes)
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ⚡
                    </motion.span>
<<<<<<< HEAD
                    <span className="text-soft-cyan text-sm font-semibold">Ready</span>
=======
                    <span className="text-sm font-semibold text-soft-cyan">Ready</span>
>>>>>>> 24d7d98 (theme changes)
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
