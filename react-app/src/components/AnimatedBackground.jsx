import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="animated-bg-container">
      {/* Mesh gradient foundation */}
      <div className="mesh-gradient-foundation" />

      {/* Smooth mouse follower - single elegant layer */}
      <motion.div
        className="mouse-follower-orb pointer-events-none"
        animate={{
          x: mousePosition.x - 300,
          y: mousePosition.y - 300,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 200,
          mass: 0.5,
        }}
      />

      {/* Large floating orbs */}
      <motion.div
        className="floating-orb-accent-primary"
        animate={{
          x: [0, 120, 0],
          y: [0, 80, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="floating-orb-accent-secondary"
        animate={{
          x: [0, -100, 0],
          y: [0, -80, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Center rotating accent */}
      <motion.div
        className="center-rotating-accent"
        animate={{
          rotate: 360,
          scale: [1, 1.3, 1],
        }}
        transition={{
          rotate: {
            duration: 60,
            repeat: Infinity,
            ease: "linear",
          },
          scale: {
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />

      {/* Subtle floating particles */}
      {[...Array(50)].map((_, i) => {
        const accentVariants = ['secondary', 'primary', 'quaternary']
        const accentVariant = accentVariants[i % 3]
        const accentClass = `floating-particle floating-particle--accent-${accentVariant}`
        
        return (
          <motion.div
            key={i}
            className={accentClass}
            style={{
              left: `${(i * 7 + 8) % 85 + 5}%`,
              top: `${(i * 11) % 70 + 15}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 2, 1],
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        )
      })}

      {/* Subtle noise texture for depth */}
      <div className="noise-texture-overlay" />

      {/* Soft vignette */}
      <div className="vignette-overlay" />

      {/* Top accent line */}
      <div className="top-accent-line" />
    </div>
  )
}
