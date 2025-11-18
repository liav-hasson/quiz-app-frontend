/**
 * Quiz API Service
 * Centralized API calls for the quiz application
 * Makes it easy to maintain and update API endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error: ${response.status} - ${errorText}`)
  }

  return response.json()
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
 * Generate a new question
 * @param {string} category - The category for the question
 * @param {string} subject - The subject for the question
 * @param {number} difficulty - The difficulty level (1-3)
 * @returns {Promise<Object>} The generated question object
 */
export async function generateQuestion(category, subject, difficulty) {
  const data = await fetchAPI('/api/question/generate', {
    method: 'POST',
    body: JSON.stringify({ category, subject, difficulty }),
  })

  if (data.error) {
    throw new Error(data.error)
  }

  return data
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

  if (data.error) {
    throw new Error(data.error)
  }

  return data.feedback
}
