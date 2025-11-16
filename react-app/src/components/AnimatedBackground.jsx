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
    <div className="fixed inset-0 -z-10 overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Mesh gradient foundation */}
      <div className="absolute inset-0 opacity-40">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.4) 0px, transparent 50%),
              radial-gradient(at 100% 0%, rgba(0, 217, 255, 0.25) 0px, transparent 50%),
              radial-gradient(at 100% 100%, rgba(79, 70, 229, 0.3) 0px, transparent 50%),
              radial-gradient(at 0% 100%, rgba(167, 139, 250, 0.25) 0px, transparent 50%)
            `
          }}
        />
      </div>

      {/* Smooth mouse follower - single elegant layer */}
      <motion.div
        className="absolute pointer-events-none"
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
      >
        <div
          className="w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 217, 255, 0.12) 0%, rgba(124, 58, 237, 0.08) 30%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
      </motion.div>

      {/* Large floating orbs */}
      <motion.div
        className="absolute top-0 left-0 w-[700px] h-[700px] -translate-x-1/2 -translate-y-1/2"
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
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(124, 58, 237, 0.08) 50%, transparent 75%)',
            filter: 'blur(80px)',
          }}
        />
      </motion.div>

      <motion.div
        className="absolute bottom-0 right-0 w-[800px] h-[800px] translate-x-1/3 translate-y-1/3"
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
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 217, 255, 0.2) 0%, rgba(0, 217, 255, 0.06) 50%, transparent 75%)',
            filter: 'blur(90px)',
          }}
        />
      </motion.div>

      {/* Center rotating accent */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2"
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
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(ellipse 80% 120%, rgba(79, 70, 229, 0.15) 0%, rgba(167, 139, 250, 0.05) 40%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
      </motion.div>

      {/* Subtle floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${(i * 7 + 8) % 85 + 5}%`,
            top: `${(i * 11) % 70 + 15}%`,
            backgroundColor: i % 3 === 0 ? 'rgba(0, 217, 255, 0.3)' : i % 3 === 1 ? 'rgba(124, 58, 237, 0.3)' : 'rgba(167, 139, 250, 0.3)',
            boxShadow: i % 3 === 0 ? '0 0 10px rgba(0, 217, 255, 0.5)' : i % 3 === 1 ? '0 0 10px rgba(124, 58, 237, 0.5)' : '0 0 10px rgba(167, 139, 250, 0.5)',
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
      ))}

      {/* Subtle noise texture for depth */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'1.2\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.4)_100%)]" />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan/30 to-transparent" />
    </div>
  )
}
