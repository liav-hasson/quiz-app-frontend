import { motion } from 'framer-motion'

export default function AnimatedBorder({ children, className = '', delay = 0 }) {
  return (
    <div className={`relative ${className}`}>
      {/* Rotating gradient border */}
      <motion.div
        className="absolute -inset-px rounded-lg opacity-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 217, 255, 0.5), rgba(124, 58, 237, 0.5), transparent)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '200% 50%'],
          opacity: [0, 0.3, 0],
        }}
        transition={{
          backgroundPosition: {
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          },
          opacity: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay,
          },
        }}
      />
      {children}
    </div>
  )
}
