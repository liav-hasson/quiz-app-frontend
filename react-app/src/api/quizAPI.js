/**
 * Quiz API Service
 * Centralized API calls for the quiz application
 * Makes it easy to maintain and update API endpoints
 */

import { USE_MOCK_API, API_BASE_URL, DEFAULT_TIMEOUT } from '../config.js'

// If using mock API, import all functions from mockAPI
import * as mockAPI from './mockAPI.js'

/**
 * Get custom AI settings from localStorage (Redux persists settings there)
 * @returns {{apiKey: string|null, model: string|null}} Custom AI settings
 */
function getCustomAISettings() {
  try {
    const settingsStr = localStorage.getItem('quiz_ai_settings')
    if (!settingsStr) return { apiKey: null, model: null }
    
    const settings = JSON.parse(settingsStr)
    return {
      apiKey: settings.customApiKey || null,
      model: settings.selectedModel || null,
    }
  } catch {
    return { apiKey: null, model: null }
  }
}

/**
 * Build headers for AI-related API calls
 * @returns {Object} Headers object with custom AI settings if available
 */
function getAIHeaders() {
  const { apiKey, model } = getCustomAISettings()
  const headers = {}
  
  if (apiKey) {
    headers['X-OpenAI-API-Key'] = apiKey
  }
  if (model) {
    headers['X-OpenAI-Model'] = model
  }
  
  return headers
}

/**
 * Generic fetch wrapper with error handling and timeout
 * Automatically injects Bearer token authentication header for protected endpoints
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {number} [options.timeout] - Request timeout in milliseconds
 * @returns {Promise<any>} Response JSON
 * @throws {Error} On network, timeout, or HTTP errors
 */
async function fetchAPI(url, options = {}) {
  const timeout = options.timeout || DEFAULT_TIMEOUT
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  // Get JWT token from localStorage
  const userStr = localStorage.getItem('quiz_user')
  const user = userStr ? JSON.parse(userStr) : null
  
  console.log(`🔍 fetchAPI ${url}:`, { 
    hasUser: !!user, 
    hasToken: !!user?.token, 
    tokenPrefix: user?.token?.substring(0, 20) 
  })
  
  const headers = {
    'Content-Type': 'application/json',
    // Use Bearer token authentication (secure)
    ...(user?.token && { 'Authorization': `Bearer ${user.token}` }),
    ...options.headers,
  }
  
  console.log(`📤 Request headers for ${url}:`, {
    hasAuthHeader: !!headers.Authorization,
    authHeaderPrefix: headers.Authorization?.substring(0, 20)
  })
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))

      // Handle authentication errors - BUT don't redirect on 401 during initial page load
      // Only redirect if we had a token that was rejected (token expired/invalid)
      if (
        response.status === 401 ||
        (response.status === 400 && errorData.error?.includes('Authentication required')) ||
        errorData.error?.toLowerCase().includes('token expired') ||
        errorData.error?.toLowerCase().includes('invalid token')
      ) {
        console.error(`❌ ${url} returned 401`, { 
          status: response.status, 
          errorData,
          hadUser: !!user,
          hadToken: !!user?.token,
          tokenPrefix: user?.token?.substring(0, 20)
        })
        
        // Only clear session and redirect if we actually sent a token that was rejected
        const hadToken = user && user.token
        if (hadToken) {
          console.warn('🔐 Token rejected by backend, clearing session')
          localStorage.removeItem('quiz_user')
          window.location.href = '/login'
          throw new Error(errorData.error || 'Session expired. Please login again.')
        }
        // Otherwise just return the error without redirecting (let components handle it)
        console.warn('⚠️ 401 error but no token was sent, not redirecting')
      }

      // For other non-auth errors (backend down, 403, 404, etc.) return a structured
      // error object instead of throwing. Callers should handle missing data gracefully.
      // 404 User not found is NOT an auth error - just means endpoint doesn't exist yet
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        const resetTime = response.headers.get('X-RateLimit-Reset')
        const limit = response.headers.get('X-RateLimit-Limit')
        console.warn('⏱️ Rate limit exceeded:', { limit, resetTime, errorData })
        return {
          ok: false,
          status: 429,
          error: errorData.error || 'Rate limit exceeded. Please wait before trying again.',
          isRateLimited: true,
          limit: parseInt(limit) || errorData.limit,
          resetTime: parseInt(resetTime) || errorData.reset_time,
          windowSeconds: errorData.window_seconds,
        }
      }
      
      return {
        ok: false,
        status: response.status,
        error: errorData.error || `API Error: ${response.status}`,
        data: errorData,
      }
    }

    const json = await response.json().catch(() => null)
    return {
      ok: true,
      status: response.status,
      data: json,
      ...json,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      return { ok: false, status: null, error: 'Request timeout - please try again' }
    }
    return { ok: false, status: null, error: error.message || String(error) }
  }
}

/**
 * Send Google credential token to backend for secure verification and JWT issuance
 * @param {Object} userData - User data from Google OAuth
 * @param {string} userData.token - Google ID token (credential)

 * @returns {Promise<{email: string, name: string, picture: string, token: string}>} Login response with JWT token and user info
 */
export async function loginUser(userData) {
  if (USE_MOCK_API) {
    console.log('🎭 Using Mock API - No backend required!')
    return mockAPI.loginUser(userData)
  }
  console.log('🔑 Sending credential to backend:', { 
    endpoint: '/api/auth/google-login',
    hasCredential: !!userData.token,
    credentialLength: userData.token?.length 
  })
  const response = await fetchAPI('/api/auth/google-login', {
    method: 'POST',
    body: JSON.stringify({
      credential: userData.token,
    }),
  })
  console.log('📨 Raw backend response:', response)
  return response
}

/**
 * Get all categories with their subjects in a single call (optimized)
 * Replaces the need for separate getCategories() and getSubjects() calls
 * @returns {Promise<Object<string, string[]>>} Object with categories as keys and subject arrays as values
 * @example
 * // Returns: { 'DevOps': ['Kubernetes', 'Docker'], 'Programming': ['Python', 'JavaScript'] }
 * @throws {Error} If API request fails
 */
export async function getCategoriesWithSubjects() {
  if (USE_MOCK_API) return mockAPI.getCategoriesWithSubjects()
  const response = await fetchAPI('/api/all-subjects')
  return response.data || {}
}

/**
 * Generate a new AI question for quiz
 * @param {string} category - The category for the question (e.g., 'DevOps')
 * @param {string} subject - The subject for the question (e.g., 'Kubernetes')
 * @param {number} difficulty - The difficulty level (1=Easy, 2=Medium, 3=Hard)
 * @returns {Promise<{question: string, keyword: string, category: string, subject: string, difficulty: number}>} Generated question object
 * @throws {Error} If API request fails or generation fails
 */
export async function generateQuestion(category, subject, difficulty) {
  if (USE_MOCK_API) return mockAPI.generateQuestion(category, subject, difficulty)
  
  // Debug: Check if user/token exists
  const userStr = localStorage.getItem('quiz_user')
  const user = userStr ? JSON.parse(userStr) : null
  console.log('🎯 generateQuestion called:', { 
    category, 
    subject, 
    difficulty,
    hasUser: !!user,
    hasToken: !!user?.token,
    email: user?.email 
  })
  
  return await fetchAPI('/api/question/generate', {
    method: 'POST',
    body: JSON.stringify({ category, subject, difficulty }),
    headers: getAIHeaders(),
  })
}

/**
 * Evaluate user's answer using AI
 * @param {string} question - The question text
 * @param {string} answer - The user's answer
 * @param {number} difficulty - The difficulty level (1-3)
 * @returns {Promise<{score: number|string, feedback: string}>} Score (0-10 or "8/10" format) and detailed feedback
 * @throws {Error} If API request fails or evaluation fails
 */
export async function evaluateAnswer(question, answer, difficulty) {
  if (USE_MOCK_API) return mockAPI.evaluateAnswer(question, answer, difficulty)
  const data = await fetchAPI('/api/answer/evaluate', {
    method: 'POST',
    body: JSON.stringify({ question, answer, difficulty }),
    headers: getAIHeaders(),
  })
  
  // Return the whole response object with score and feedback
  return data
}

/**
 * Test custom AI configuration by making a minimal API call
 * @param {string} [apiKey] - Optional custom API key to test (uses saved settings if not provided)
 * @param {string} [model] - Optional model to test (uses saved settings if not provided)
 * @returns {Promise<{ok: boolean, message: string, model: string}>} Test result
 */
export async function testAIConfiguration(apiKey, model) {
  if (USE_MOCK_API) {
    // Mock always succeeds
    return { 
      ok: true, 
      message: 'Mock API test successful!', 
      model: model || 'mock-model' 
    }
  }
  
  // Build headers - use provided values or fall back to saved settings
  const headers = {}
  const { apiKey: savedApiKey, model: savedModel } = getCustomAISettings()
  
  const testApiKey = apiKey !== undefined ? apiKey : savedApiKey
  const testModel = model !== undefined ? model : savedModel
  
  if (testApiKey) {
    headers['X-OpenAI-API-Key'] = testApiKey
  }
  if (testModel) {
    headers['X-OpenAI-Model'] = testModel
  }
  
  const response = await fetchAPI('/api/ai/test', {
    method: 'POST',
    headers,
  })
  
  return response
}

/**
 * Persist an evaluated answer so it appears in the user's history
 * @param {Object} payload - Answer metadata
 * @param {string} payload.question - Question text
 * @param {string} payload.answer - User's answer
 * @param {number} payload.difficulty - Difficulty level
 * @param {string} payload.category - Category name
 * @param {string} payload.subject - Subject name
 * @param {string} payload.keyword - Topic keyword
 * @param {number|string} payload.score - AI score
 * @param {Object} payload.evaluation - Evaluation details
 * @param {Object} payload.metadata - Additional metadata
 * @returns {Promise<{answer_id: string}>} Created answer ID
 * @throws {Error} If API request fails
 */
export async function saveAnswerHistory(payload) {
  if (USE_MOCK_API) return mockAPI.saveAnswerHistory(payload)
  return await fetchAPI('/api/user/answers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Fetch the authenticated user's question history
 * @param {Object} [params={}] - Query parameters
 * @param {number} [params.limit] - Maximum number of entries to return (default: 20, max: 100)
 * @param {string} [params.before] - ISO timestamp to fetch entries before this time
 * @returns {Promise<Array<{id: string, summary: Object, details: Object}>>} Array of history entries
 * @throws {Error} If API request fails or user not authenticated
 */
export async function getUserHistory(params = {}) {
  if (USE_MOCK_API) return mockAPI.getUserHistory(params)
  
  // Get user email from localStorage to support Dev Login without valid token
  const userStr = localStorage.getItem('quiz_user')
  const user = userStr ? JSON.parse(userStr) : null

  const searchParams = new URLSearchParams()
  if (params.limit) {
    searchParams.set('limit', params.limit)
  }
  if (params.before) {
    searchParams.set('before', params.before)
  }
  
  // Add email if available and not already in params
  if (user?.email && !params.email) {
    searchParams.set('email', user.email)
  }

  const query = searchParams.toString()
  const response = await fetchAPI(`/api/user/history${query ? `?${query}` : ''}`)
  return response.history || []
}

/**
 * Fetch user performance summary suitable for charting
 * Preferred response shape (example):
 * {
 *   performance: [
 *     { date: '2025-11-01T12:00:00Z', overall: 7, categories: { DevOps: 7, Programming: 6 } },
 *     ...
 *   ]
 * }
 */
export async function getUserPerformance(params = {}) {
  if (USE_MOCK_API) return mockAPI.getUserPerformance(params)
  const searchParams = new URLSearchParams()
  // Backend expects 'period' (7d, 30d, all) and 'granularity' (day, week)
  if (params.period) searchParams.set('period', params.period)
  if (params.granularity) searchParams.set('granularity', params.granularity)
  const query = searchParams.toString()

  const response = await fetchAPI(`/api/user/performance${query ? `?${query}` : ''}`)

  // If the request failed (backend down, 403, etc.), return an empty array so callers
  // (charts/components) can render a friendly empty state without throwing.
  if (!response || response.ok === false) return []

  // Backend returns { period, data_points, summary }
  // Check for data_points first, then try common shapes
  return (
    response.data_points || response.performance || response.data?.performance || response.data || response
  )
}

/**
 * Fetch authenticated user's profile data including stats
 * @returns {Promise<{XP: number, bestCategory: string, totalAnswers: number, averageScore: number, lastActivity: string}>}
 * Returns user stats calculated on backend
 */
export async function getUserProfile() {
  if (USE_MOCK_API) return mockAPI.getUserProfile()
  
  // Get user email from localStorage to support the case where token isn't available yet
  const userStr = localStorage.getItem('quiz_user')
  const user = userStr ? JSON.parse(userStr) : null

  const searchParams = new URLSearchParams()
  // Add email if available and not already in params
  if (user?.email) {
    searchParams.set('email', user.email)
  }
  
  const query = searchParams.toString()
  const response = await fetchAPI(`/api/user/profile${query ? `?${query}` : ''}`)
  
  // If the request failed, return empty data
  if (!response || response.ok === false) {
    return { XP: 0, bestCategory: null, totalAnswers: 0, averageScore: null, lastActivity: null }
  }
  
  return {
    XP: response.XP ?? response.xp ?? 0,
    bestCategory: response.bestCategory ?? response.best_category ?? null,
    totalAnswers: response.totalAnswers ?? response.total_answers ?? 0,
    averageScore: response.averageScore ?? response.average_score ?? null,
    lastActivity: response.lastActivity ?? response.last_activity ?? null,
  }
}

/**
 * @deprecated Use getUserProfile() instead for user stats
 * Fetch user's best category as a single string (backend-preferred)
 * Preferred endpoint: GET /api/user/best-category -> { bestCategory: 'DevOps' }
 * Falls back to common keys if backend returns different shape.
 */
export async function getUserBestCategory() {
  if (USE_MOCK_API) return mockAPI.getUserBestCategory()
  const response = await fetchAPI('/api/user/best-category')
  return (
    response.bestCategory ||
    response.best_category ||
    response.data?.bestCategory ||
    response.data?.best_category ||
    response.category ||
    null
  )
}

/**
 * Fetch enhanced leaderboard data including top 10 users and current user's rank
 * @returns {Promise<{topTen: Array<{rank: number, username: string, score: number, _id: string}>, userRank: number|null}>}
 * Returns top 10 leaderboard entries and authenticated user's rank
 */
export async function getLeaderboard() {
  if (USE_MOCK_API) return mockAPI.getLeaderboard()
  const response = await fetchAPI('/api/user/leaderboard')
  
  // If the request failed, return empty data
  if (!response || response.ok === false) {
    return { topTen: [], userRank: null }
  }
  
  return {
    topTen: response.leaderboard || response.data?.leaderboard || [],
    userRank: response.current_user?.rank ?? response.currentUser?.rank ?? null,
  }
}

/**
 * Create a new multiplayer lobby
 * @param {Object} settings - Game settings
 * @param {string[]} [settings.categories] - Categories for questions
 * @param {number} [settings.difficulty] - Difficulty level (1-3)
 * @param {number} [settings.question_timer] - Seconds per question
 * @param {number} [settings.max_players] - Maximum players allowed
 * @returns {Promise<{code: string, lobbyId: string, lobby: Object}>}
 */
export async function createLobby(settings) {
  if (USE_MOCK_API) return mockAPI.createLobby(settings)
  return await fetchAPI('/api/multiplayer/lobby', {
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

/**
 * Join an existing multiplayer lobby
 * @param {string} code - Lobby code
 * @returns {Promise<{code: string, lobby: Object}>}
 */
export async function joinLobby(code) {
  if (USE_MOCK_API) return mockAPI.joinLobby(code)
  return await fetchAPI('/api/multiplayer/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

/**
 * Get lobby details by code
 * @param {string} lobbyCode - The 6-character lobby code
 * @returns {Promise<{lobby: Object}>}
 */
export async function getLobbyDetails(lobbyCode) {
  if (USE_MOCK_API) return mockAPI.getLobbyDetails(lobbyCode)
  return await fetchAPI(`/api/multiplayer/lobby/${lobbyCode}`)
}

/**
 * Update lobby settings (creator only)
 * @param {string} lobbyCode - The 6-character lobby code
 * @param {Object} settings - Settings to update
 * @param {string[]} [settings.categories] - Categories for questions
 * @param {number} [settings.difficulty] - Difficulty level (1-3)
 * @param {number} [settings.question_timer] - Seconds per question
 * @param {number} [settings.max_players] - Maximum players allowed
 * @param {Array} [settings.question_sets] - Array of question set objects
 * @returns {Promise<{lobby: Object}>}
 */
export async function updateLobbySettings(lobbyCode, settings) {
  if (USE_MOCK_API) return mockAPI.getLobbyDetails(lobbyCode) // Mock doesn't support updates yet
  return await fetchAPI(`/api/multiplayer/lobby/${lobbyCode}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  })
}

/**
 * Leave a lobby
 * @param {string} lobbyCode - The 6-character lobby code
 * @returns {Promise<{success: boolean}>}
 */
export async function leaveLobby(lobbyCode) {
  if (USE_MOCK_API) return mockAPI.leaveLobby(lobbyCode)
  return await fetchAPI(`/api/multiplayer/lobby/${lobbyCode}/leave`, {
    method: 'POST',
  })
}

/**
 * Toggle ready status in lobby
 * @param {string} lobbyCode - The 6-character lobby code
 * @param {boolean} ready - Ready state
 * @returns {Promise<{lobby: Object, all_ready: boolean}>}
 */
export async function toggleReady(lobbyCode, ready) {
  if (USE_MOCK_API) return mockAPI.toggleReady(lobbyCode, ready)
  return await fetchAPI(`/api/multiplayer/lobby/${lobbyCode}/ready`, {
    method: 'POST',
    body: JSON.stringify({ ready }),
  })
}

/**
 * Start the game (creator only)
 * @param {string} lobbyCode - The 6-character lobby code
 * @returns {Promise<{success: boolean, status: string}>}
 */
export async function startGame(lobbyCode) {
  if (USE_MOCK_API) {
    return { ok: true, success: true, status: 'countdown' }
  }
  const response = await fetchAPI(`/api/multiplayer/lobby/${lobbyCode}/start`, {
    method: 'POST',
  })
  
  // Handle rate limiting and errors explicitly
  if (!response.ok) {
    if (response.isRateLimited) {
      // Rate limit error - pass through for special handling
      throw new Error(response.error || 'Rate limit exceeded')
    }
    // Other errors (question generation, validation, etc.)
    throw new Error(response.error || 'Failed to start game')
  }
  
  return response
}

/**
 * Get list of active lobbies
 * @returns {Promise<{lobbies: Array}>}
 */
export async function getActiveLobbies() {
  if (USE_MOCK_API) return mockAPI.getActiveLobbies()
  return await fetchAPI('/api/multiplayer/lobbies')
}

/**
 * Claim bonus XP from daily missions or other rewards
 * @param {number} xp - Amount of XP to claim
 * @param {string} source - Source of the XP (e.g., 'daily_mission')
 * @returns {Promise<{success: boolean, xp_claimed: number}>}
 */
export async function claimBonusXP(xp, source = 'daily_mission') {
  if (USE_MOCK_API) return { success: true, xp_claimed: xp }
  return await fetchAPI('/api/user/claim-bonus-xp', {
    method: 'POST',
    body: JSON.stringify({ xp, source }),
  })
}