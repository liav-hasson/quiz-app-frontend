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
    if (response.status === 401 || 
        (response.status === 404 && errorData.error?.includes('User not found')) ||
        (response.status === 400 && errorData.error?.includes('Authentication required'))) {
      localStorage.removeItem('quiz_user')
      window.location.href = '/login'
      throw new Error(errorData.error || 'Session expired. Please login again.')
    }
    
      throw new Error(errorData.error || `API Error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again')
    }
    throw error
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