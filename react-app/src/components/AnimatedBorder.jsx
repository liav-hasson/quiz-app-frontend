import { motion } from 'framer-motion'

export default function AnimatedBorder({ children, className = '', delay = 0 }) {
  return (
    <div className={`animated-border-wrapper ${className}`}>
      {/* Rotating gradient border */}
      <motion.div
        className="animated-border-gradient"
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
