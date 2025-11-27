/**
 * Quiz API Service
 * Centralized API calls for the quiz application
 * Makes it easy to maintain and update API endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const DEFAULT_TIMEOUT = 30000 // 30 seconds

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
  
  const headers = {
    'Content-Type': 'application/json',
    // Use Bearer token authentication (secure)
    ...(user?.token && { 'Authorization': `Bearer ${user.token}` }),
    ...options.headers,
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))

      // Handle authentication errors - clear session and redirect to login
      if (
        response.status === 401 ||
        (response.status === 404 && errorData.error?.includes('User not found')) ||
        (response.status === 400 && errorData.error?.includes('Authentication required'))
      ) {
        localStorage.removeItem('quiz_user')
        window.location.href = '/login'
        // keep throwing here to stop further execution if auth is invalid
        throw new Error(errorData.error || 'Session expired. Please login again.')
      }

      // For other non-auth errors (backend down, 403, 404 generic, etc.) return a structured
      // error object instead of throwing. Callers should handle missing data gracefully.
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
  return await fetchAPI('/api/auth/google-login', {
    method: 'POST',
    body: JSON.stringify({
      credential: userData.token,
    }),
  })
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
  return await fetchAPI('/api/question/generate', {
    method: 'POST',
    body: JSON.stringify({ category, subject, difficulty }),
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
  const data = await fetchAPI('/api/answer/evaluate', {
    method: 'POST',
    body: JSON.stringify({ question, answer, difficulty }),
  })
  
  // Return the whole response object with score and feedback
  return data
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
  const searchParams = new URLSearchParams()
  if (params.limit) {
    searchParams.set('limit', params.limit)
  }
  if (params.before) {
    searchParams.set('before', params.before)
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
  const searchParams = new URLSearchParams()
  // Backend expects 'period' (7d, 30d, all) and 'granularity' (day, week)
  if (params.period) searchParams.set('period', params.period)
  if (params.granularity) searchParams.set('granularity', params.granularity)
  const query = searchParams.toString()

  const response = await fetchAPI(`/api/user/performance${query ? `?${query}` : ''}`)

  // If the request failed (backend down, 403, etc.), return an empty array so callers
  // (charts/components) can render a friendly empty state without throwing.
  if (!response || response.ok === false) return []

  // Try common shapes: top-level `performance`, `data.performance`, or `data` as array
  return (
    response.performance || response.data?.performance || response.data || response
  )
}

/**
 * Fetch authenticated user's profile data including stats
 * @returns {Promise<{XP: number, bestCategory: string, totalAnswers: number, averageScore: number, lastActivity: string}>}
 * Returns user stats calculated on backend
 */
export async function getUserProfile() {
  const response = await fetchAPI('/api/user/profile')
  
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
  const response = await fetchAPI('/api/user/leaderboard/enhanced')
  
  // If the request failed, return empty data
  if (!response || response.ok === false) {
    return { topTen: [], userRank: null }
  }
  
  return {
    topTen: response.topTen || response.top_ten || response.data?.topTen || [],
    userRank: response.userRank ?? response.user_rank ?? response.data?.userRank ?? null,
  }
}