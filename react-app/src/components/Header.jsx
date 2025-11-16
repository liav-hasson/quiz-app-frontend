import { motion } from 'framer-motion'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate/90 backdrop-blur-md border-b border-cyan/20 shadow-lg shadow-purple/5">
      {/* Animated border gradient */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-cyan to-transparent opacity-50"
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
          <div className="relative">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {/* Icon */}
              <motion.div
                className="relative w-10 h-10 bg-linear-to-br from-cyan via-purple to-indigo rounded-lg flex items-center justify-center overflow-hidden shadow-lg shadow-purple/50"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-linear-to-tr from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                />
                <span className="text-2xl font-bold text-white relative z-10">Q</span>
              </motion.div>

              {/* Text */}
              <div className="flex flex-col">
                <motion.h1 
                  className="text-2xl font-bold leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #00D9FF 0%, #A78BFA 50%, #7C3AED 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Quiz Labs
                </motion.h1>
                <motion.div
                  className="h-0.5 bg-linear-to-r from-cyan via-purple-light to-transparent"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Subtle glow effect */}
            <motion.div
              className="absolute -inset-2 bg-linear-to-r from-cyan/30 to-purple/30 rounded-lg blur-xl -z-10"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Right side - Stats or Actions */}
          <div className="ml-auto flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3"
            >
              {/* Fun fact or tip */}
              <motion.div
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple/10 border border-purple/30 rounded-lg backdrop-blur-sm"
                whileHover={{ scale: 1.02, borderColor: 'rgba(124, 58, 237, 0.5)' }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-lg"
                >
                  💡
                </motion.span>
                <span className="text-silver text-sm font-medium">
                  Test Your DevOps Skills
                </span>
              </motion.div>

              {/* Status indicator */}
              <motion.div
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-cyan/10 border border-cyan/30 rounded-lg backdrop-blur-sm"
                whileHover={{ scale: 1.05, borderColor: 'rgba(0, 217, 255, 0.5)' }}
              >
                <motion.span 
                  className="text-cyan text-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⚡
                </motion.span>
                <span className="text-silver text-sm font-semibold">Ready</span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
