import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), visualizer({ filename: 'dist/stats.html', open: false })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Split common heavy libraries into separate vendor chunks to reduce main bundle size
          manualChunks(id) {
            if (!id) return
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) return 'vendor_recharts'
              if (id.includes('framer-motion')) return 'vendor_framer'
              if (id.includes('react-dom') || id.includes('react/jsx-runtime')) return 'vendor_react'
              if (id.includes('react-router-dom')) return 'vendor_react_router'
              if (id.includes('@reduxjs') || id.includes('react-redux') || id.includes('@reduxjs')) return 'vendor_redux'
              if (id.includes('lucide-react')) return 'vendor_icons'
              // Put the rest of node_modules into a vendor chunk for better caching
              return 'vendor_misc'
            }
          }
        }
      }
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
