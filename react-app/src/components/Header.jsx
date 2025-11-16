import { motion } from 'framer-motion'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-yellow/20">
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
                className="relative w-10 h-10 bg-linear-to-br from-yellow to-lime-cream rounded-lg flex items-center justify-center overflow-hidden"
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
                <span className="text-2xl font-bold text-graphite relative z-10">Q</span>
              </motion.div>

              {/* Text */}
              <div className="flex flex-col">
                <motion.h1 
                  className="text-2xl font-bold leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #F6F930 0%, #D2F898 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Quiz Labs
                </motion.h1>
                <motion.div
                  className="h-0.5 bg-linear-to-r from-yellow via-lime-cream to-transparent"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Subtle glow effect */}
            <motion.div
              className="absolute -inset-2 bg-linear-to-r from-yellow/20 to-lime-cream/20 rounded-lg blur-xl -z-10"
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

          {/* Optional: Add navigation or user info here */}
          <div className="ml-auto flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lime-cream/60 text-sm font-medium hidden sm:block"
            >
              DevOps Knowledge Testing
            </motion.div>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
