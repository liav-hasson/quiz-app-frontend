/**
 * Centralized Configuration
 * Single source of truth for all environment-dependent settings
 * 
 * Production uses nginx to proxy both /api/ and /socket.io/ to backends,
 * so we use empty strings (relative URLs) by default.
 * 
 * Local development can override with VITE_* env vars in .env.local
 */

/**
 * API Base URL
 * - Empty string in production (nginx proxies /api/ to backend)
 * - Can be set to 'http://localhost:5000' for local dev without nginx
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Multiplayer/WebSocket URL
 * - Empty string in production (nginx proxies /socket.io/ to multiplayer backend)
 * - Can be set to 'http://localhost:5001' for local dev without nginx
 */
export const MULTIPLAYER_URL = import.meta.env.VITE_MULTIPLAYER_URL || ''

/**
 * Google OAuth Client ID
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

/**
 * Request timeout settings
 */
export const DEFAULT_TIMEOUT = 30000 // 30 seconds

/**
 * Log current configuration (useful for debugging)
 */
export function logConfig() {
  console.log('📋 App Configuration:', {
    API_BASE_URL: API_BASE_URL || '(nginx proxy)',
    MULTIPLAYER_URL: MULTIPLAYER_URL || '(nginx proxy)',
    GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : '(not set)',
  })
}

// Log config on startup in development
if (import.meta.env.DEV) {
  logConfig()
}

export default {
  API_BASE_URL,
  MULTIPLAYER_URL,
  GOOGLE_CLIENT_ID,
  DEFAULT_TIMEOUT,
  logConfig,
}
