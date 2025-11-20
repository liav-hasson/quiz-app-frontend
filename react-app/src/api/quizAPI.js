/**
 * Quiz API Service
 * Centralized API calls for the quiz application
 * Makes it easy to maintain and update API endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Generic fetch wrapper with error handling
 * Automatically injects user email header for protected endpoints
 */
async function fetchAPI(url, options = {}) {
  // Auto-inject email header from localStorage for protected endpoints
  const userStr = localStorage.getItem('quiz_user')
  const user = userStr ? JSON.parse(userStr) : null
  
  const headers = {
    'Content-Type': 'application/json',
    ...(user?.email && { 'X-User-Email': user.email }),
    ...options.headers,
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    
    // Handle user not found error - clear session and redirect to login
    if (response.status === 404 && errorData.error?.includes('User not found')) {
      localStorage.removeItem('quiz_user')
      window.location.href = '/login'
      throw new Error('Session expired. Please login again.')
    }
    
    // Handle missing email error
    if (response.status === 400 && errorData.error?.includes('Email is required')) {
      localStorage.removeItem('quiz_user')
      window.location.href = '/login'
      throw new Error('Authentication required. Please login.')
    }
    
    throw new Error(errorData.error || `API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * Send user login information to backend
 * @param {Object} userData - User data from Google OAuth
 * @param {string} userData.id - User's unique ID
 * @param {string} userData.email - User's email
 * @param {string} userData.name - User's name
 * @returns {Promise<Object>} Login response from backend
 */
export async function loginUser(userData) {
  return await fetchAPI('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      id: userData.id,
      email: userData.email,
      name: userData.name,
    }),
  })
}

/**
 * Get all available categories
 * @returns {Promise<string[]>} Array of category names
 */
export async function getCategories() {
  const data = await fetchAPI('/api/categories')
  return data.categories || []
}

/**
 * Get subjects for a specific category
 * @param {string} category - The category to get subjects for
 * @returns {Promise<string[]>} Array of subject names
 */
export async function getSubjects(category) {
  const data = await fetchAPI(`/api/subjects?category=${encodeURIComponent(category)}`)
  return data.subjects || []
}

/**
 * Get all categories with their subjects in a single call
 * @returns {Promise<Object>} Object with categories as keys and subject arrays as values
 */
export async function getCategoriesWithSubjects() {
  const response = await fetchAPI('/api/all-subjects')
  return response.data || {}
}

/**
 * Generate a new question
 * @param {string} category - The category for the question
 * @param {string} subject - The subject for the question
 * @param {number} difficulty - The difficulty level (1-3)
 * @returns {Promise<Object>} The generated question object
 */
export async function generateQuestion(category, subject, difficulty) {
  return await fetchAPI('/api/question/generate', {
    method: 'POST',
    body: JSON.stringify({ category, subject, difficulty }),
  })
}

/**
 * Evaluate user's answer
 * @param {string} question - The question text
 * @param {string} answer - The user's answer
 * @param {number} difficulty - The difficulty level
 * @returns {Promise<string>} The feedback text
 */
export async function evaluateAnswer(question, answer, difficulty) {
  const data = await fetchAPI('/api/answer/evaluate', {
    method: 'POST',
    body: JSON.stringify({ question, answer, difficulty }),
  })
  
  return data.feedback
}