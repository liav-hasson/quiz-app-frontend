/**
 * Quiz API Service
 * Centralized API calls for the quiz application (real backend only)
 */

import { API_BASE_URL, DEFAULT_TIMEOUT } from '../config.js'

const isDev = import.meta.env?.DEV

function debugLog(message, payload = {}) {
  if (isDev) {
    console.debug(message, payload)
  }
}

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

function getAIHeaders() {
  const { apiKey, model } = getCustomAISettings()
  const headers = {}
  if (apiKey) headers['X-OpenAI-API-Key'] = apiKey
  if (model) headers['X-OpenAI-Model'] = model
  return headers
}

async function fetchAPI(url, options = {}) {
  const timeout = options.timeout || DEFAULT_TIMEOUT
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const userStr = localStorage.getItem('quiz_user')
  const user = userStr ? JSON.parse(userStr) : null

  const headers = {
    'Content-Type': 'application/json',
    ...(user?.token && { Authorization: `Bearer ${user.token}` }),
    ...options.headers,
  }

  debugLog(`fetchAPI ${url}`, { hasUser: !!user, hasToken: !!user?.token })

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))

      const isAuthError =
        response.status === 401 ||
        (response.status === 400 && errorData.error?.includes('Authentication required')) ||
        errorData.error?.toLowerCase().includes('token expired') ||
        errorData.error?.toLowerCase().includes('invalid token')

      if (!options.skipAuthRedirect && isAuthError) {
        if (user?.token) {
          localStorage.removeItem('quiz_user')
          window.location.href = '/login'
        }
      }

      if (response.status === 429) {
        const resetTime = response.headers.get('X-RateLimit-Reset')
        const limit = response.headers.get('X-RateLimit-Limit')
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
    return { ok: true, status: response.status, data: json, ...json }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      return { ok: false, status: null, error: 'Request timeout - please try again' }
    }
    return { ok: false, status: null, error: error.message || String(error) }
  }
}

export async function loginUser(userData) {
  debugLog('Sending credential to backend', {
    endpoint: '/api/auth/google-login',
    hasCredential: !!userData.token,
  })
  const response = await fetchAPI('/api/auth/google-login', {
    method: 'POST',
    body: JSON.stringify({ credential: userData.token }),
  })
  return response
}

export async function guestLoginUser({ username }) {
  debugLog('Guest login request', { username })

  const response = await fetch(`${API_BASE_URL}/api/auth/guest-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Guest login failed' }))
    throw new Error(error.error || 'Guest login failed')
  }

  const data = await response.json()
  debugLog('Guest login response received')
  return data
}

export async function getCategoriesWithSubjects() {
  const response = await fetchAPI('/api/all-subjects')
  return response.data || {}
}

export async function generateQuestion(category, subject, difficulty) {
  return await fetchAPI('/api/question/generate', {
    method: 'POST',
    body: JSON.stringify({ category, subject, difficulty }),
    headers: getAIHeaders(),
  })
}

export async function evaluateAnswer(question, answer, difficulty) {
  return await fetchAPI('/api/answer/evaluate', {
    method: 'POST',
    body: JSON.stringify({ question, answer, difficulty }),
    headers: getAIHeaders(),
  })
}

export async function testAIConfiguration(apiKey, model) {
  const headers = {}
  const { apiKey: savedApiKey, model: savedModel } = getCustomAISettings()
  const testApiKey = apiKey !== undefined ? apiKey : savedApiKey
  const testModel = model !== undefined ? model : savedModel
  if (testApiKey) headers['X-OpenAI-API-Key'] = testApiKey
  if (testModel) headers['X-OpenAI-Model'] = testModel

  return await fetchAPI('/api/ai/test', {
    method: 'POST',
    headers,
    skipAuthRedirect: true,
  })
}

export async function saveAnswerHistory(payload) {
  return await fetchAPI('/api/user/answers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getUserHistory(params = {}) {
  const userStr = localStorage.getItem('quiz_user')
  const user = userStr ? JSON.parse(userStr) : null

  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.set('limit', params.limit)
  if (params.before) searchParams.set('before', params.before)
  if (user?.email && !params.email) searchParams.set('email', user.email)

  const query = searchParams.toString()
  const response = await fetchAPI(`/api/user/history${query ? `?${query}` : ''}`)
  return response.history || []
}

export async function getUserPerformance(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.period) searchParams.set('period', params.period)
  if (params.granularity) searchParams.set('granularity', params.granularity)
  const query = searchParams.toString()

  const response = await fetchAPI(`/api/user/performance${query ? `?${query}` : ''}`)
  if (!response || response.ok === false) return []
  return response.data_points || response.performance || response.data?.performance || response.data || response
}

export async function getUserProfile() {
  const response = await fetchAPI('/api/user/profile')
  if (!response || response.ok === false) {
    return { XP: 0, bestCategory: null, totalAnswers: 0, averageScore: null, lastActivity: null }
  }
  return response.data || response
}

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

export async function getLeaderboard() {
  const response = await fetchAPI('/api/user/leaderboard')
  if (!response || response.ok === false) {
    return { topTen: [], userRank: null }
  }
  return {
    topTen: response.leaderboard || response.data?.leaderboard || [],
    userRank: response.current_user?.rank ?? response.currentUser?.rank ?? null,
  }
}

export async function createLobby(settings) {
  return await fetchAPI('/api/multiplayer/lobby', {
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

export async function joinLobby(code) {
  return await fetchAPI('/api/multiplayer/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export async function getLobbyDetails(lobbyCode) {
  return await fetchAPI(`/api/multiplayer/lobby/${lobbyCode}`)
}

export async function updateLobbySettings(lobbyCode, settings) {
  return await fetchAPI(`/api/multiplayer/lobby/${lobbyCode}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  })
}

export async function leaveLobby(lobbyCode) {
  return await fetchAPI(`/api/multiplayer/lobby/${lobbyCode}/leave`, {
    method: 'POST',
  })
}

export async function toggleReady(lobbyCode, ready) {
  return await fetchAPI(`/api/multiplayer/lobby/${lobbyCode}/ready`, {
    method: 'POST',
    body: JSON.stringify({ ready }),
  })
}

export async function startGame(lobbyCode) {
  const response = await fetchAPI(`/api/multiplayer/lobby/${lobbyCode}/start`, {
    method: 'POST',
  })
  if (!response.ok) {
    if (response.isRateLimited) throw new Error(response.error || 'Rate limit exceeded')
    throw new Error(response.error || 'Failed to start game')
  }
  return response
}

export async function getActiveLobbies() {
  return await fetchAPI('/api/multiplayer/lobbies')
}

export async function claimBonusXP(xp, source = 'daily_mission') {
  return await fetchAPI('/api/user/claim-bonus-xp', {
    method: 'POST',
    body: JSON.stringify({ xp, source }),
  })
}