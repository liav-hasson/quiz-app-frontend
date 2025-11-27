/**
 * Mock API Service for Frontend-Only Development
 * Use this when you want to develop the frontend without running the backend
 * 
 * To enable: Set VITE_USE_MOCK_API=true in your .env file
 */

// Mock data store
const mockStore = {
  user: null,
  questions: [],
  categories: {
    'DevOps': ['CI/CD', 'Kubernetes', 'Docker', 'Terraform', 'Monitoring'],
    'Programming': ['Python', 'JavaScript', 'Go', 'Rust'],
    'Cloud': ['AWS', 'Azure', 'GCP'],
    'Networking': ['TCP/IP', 'DNS', 'Load Balancing'],
  },
  leaderboard: [
    { rank: 1, username: 'Alice', score: 850, _id: '1' },
    { rank: 2, username: 'Bob', score: 720, _id: '2' },
    { rank: 3, username: 'Charlie', score: 680, _id: '3' },
    { rank: 4, username: 'Diana', score: 650, _id: '4' },
    { rank: 5, username: 'Eve', score: 620, _id: '5' },
    { rank: 6, username: 'Frank', score: 580, _id: '6' },
    { rank: 7, username: 'Grace', score: 550, _id: '7' },
    { rank: 8, username: 'Hank', score: 520, _id: '8' },
    { rank: 9, username: 'Ivy', score: 490, _id: '9' },
    { rank: 10, username: 'Jack', score: 460, _id: '10' },
  ],
}

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Generate random score based on difficulty
const getRandomScore = (difficulty) => {
  const baseScore = difficulty === 1 ? 7 : difficulty === 2 ? 6 : 5
  return Math.floor(baseScore + Math.random() * 3)
}

// Mock Questions Database
const mockQuestions = {
  'DevOps': {
    'CI/CD': [
      'What is the main purpose of continuous integration?',
      'Explain the difference between continuous delivery and continuous deployment.',
      'How does a Jenkins pipeline work?',
    ],
    'Kubernetes': [
      'What is a Kubernetes pod?',
      'Explain the role of a Kubernetes service.',
      'How do you scale a deployment in Kubernetes?',
    ],
    'Docker': [
      'What is the difference between a Docker image and a container?',
      'How do you optimize Docker image size?',
      'Explain Docker networking modes.',
    ],
  },
  'Programming': {
    'Python': [
      'What is a Python decorator?',
      'Explain list comprehension in Python.',
      'What is the difference between @staticmethod and @classmethod?',
    ],
    'JavaScript': [
      'What is closure in JavaScript?',
      'Explain async/await in JavaScript.',
      'What is the event loop?',
    ],
  },
}

/**
 * Mock login - returns a fake JWT token
 */
export async function loginUser(userData) {
  await delay(800)
  
  const mockUser = {
    email: 'mock.user@example.com',
    name: 'Mock User',
    picture: 'https://via.placeholder.com/150',
    token: 'mock-jwt-token-' + Date.now(),
  }
  
  mockStore.user = mockUser
  localStorage.setItem('quiz_user', JSON.stringify(mockUser))
  
  return {
    ok: true,
    status: 200,
    data: mockUser,
    ...mockUser,
  }
}

/**
 * Mock get categories with subjects
 */
export async function getCategoriesWithSubjects() {
  await delay(300)
  return {
    ok: true,
    status: 200,
    data: mockStore.categories,
  }
}

/**
 * Mock generate question
 */
export async function generateQuestion(category, subject, difficulty) {
  await delay(1500) // Simulate AI processing time
  
  const categoryQuestions = mockQuestions[category]?.[subject]
  const questions = categoryQuestions || ['What is ' + subject + '?']
  const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
  
  const questionData = {
    question: randomQuestion,
    keyword: subject,
    category,
    subject,
    difficulty,
    id: 'q-' + Date.now(),
  }
  
  mockStore.questions.push(questionData)
  
  return {
    ok: true,
    status: 200,
    data: questionData,
    ...questionData,
  }
}

/**
 * Mock evaluate answer
 */
export async function evaluateAnswer(question, answer, difficulty) {
  await delay(2000) // Simulate AI evaluation time
  
  const score = getRandomScore(difficulty)
  
  const feedbacks = [
    'Good attempt! You covered the main concepts.',
    'Excellent answer! You demonstrated deep understanding.',
    'Nice work! Consider adding more specific examples.',
    'Great explanation! Well structured and clear.',
    'Solid answer. You could expand on the technical details.',
  ]
  
  const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)]
  
  return {
    ok: true,
    status: 200,
    score,
    feedback,
    data: { score, feedback },
  }
}

/**
 * Mock save answer history
 */
export async function saveAnswerHistory(payload) {
  await delay(200)
  
  const answerId = 'ans-' + Date.now()
  
  return {
    ok: true,
    status: 200,
    answer_id: answerId,
    data: { answer_id: answerId },
  }
}

/**
 * Mock get user history
 */
export async function getUserHistory(params = {}) {
  await delay(400)
  
  const limit = params.limit || 20
  const history = []
  
  // Generate mock history
  for (let i = 0; i < Math.min(limit, 15); i++) {
    const categories = Object.keys(mockStore.categories)
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    const subjects = mockStore.categories[randomCategory]
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)]
    const randomDifficulty = Math.floor(Math.random() * 3) + 1
    
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    history.push({
      id: 'h-' + i,
      summary: {
        question: mockQuestions[randomCategory]?.[randomSubject]?.[0] || 'Sample question?',
        answer: 'This is a mock answer for testing purposes.',
        score: getRandomScore(randomDifficulty),
        date: date.toISOString(),
      },
      details: {
        category: randomCategory,
        subject: randomSubject,
        difficulty: randomDifficulty,
        keyword: randomSubject,
        feedback: 'Good work! Keep learning.',
      },
    })
  }
  
  return {
    ok: true,
    status: 200,
    history,
    data: { history },
  }
}

/**
 * Mock get user performance
 */
export async function getUserPerformance(params = {}) {
  await delay(500)
  
  const period = params.period || '30d'
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  
  const performance = []
  const categories = Object.keys(mockStore.categories)
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const categoryScores = {}
    categories.forEach(cat => {
      categoryScores[cat] = Math.floor(5 + Math.random() * 5) // Score 5-10
    })
    
    const overall = Math.floor(
      Object.values(categoryScores).reduce((a, b) => a + b, 0) / categories.length
    )
    
    performance.push({
      date: date.toISOString(),
      overall,
      categories: categoryScores,
    })
  }
  
  return {
    ok: true,
    status: 200,
    performance,
    data: { performance },
  }
}

/**
 * Mock get user profile
 */
export async function getUserProfile() {
  await delay(300)
  
  const profile = {
    XP: 450,
    bestCategory: 'DevOps',
    totalAnswers: 23,
    averageScore: 7.5,
    lastActivity: new Date().toISOString(),
  }
  
  return {
    ok: true,
    status: 200,
    ...profile,
    data: profile,
  }
}

/**
 * Mock get user best category
 */
export async function getUserBestCategory() {
  await delay(200)
  
  return {
    ok: true,
    status: 200,
    bestCategory: 'DevOps',
    data: { bestCategory: 'DevOps' },
  }
}

/**
 * Mock get leaderboard
 */
export async function getLeaderboard() {
  await delay(400)
  
  // Add current user to leaderboard if not already there
  const currentUser = mockStore.user
  const userInLeaderboard = mockStore.leaderboard.find(
    entry => entry.username === currentUser?.name
  )
  
  let userRank = null
  if (currentUser && !userInLeaderboard) {
    userRank = 15 // Mock rank outside top 10
  } else if (userInLeaderboard) {
    userRank = userInLeaderboard.rank
  }
  
  return {
    ok: true,
    status: 200,
    topTen: mockStore.leaderboard,
    userRank,
    data: {
      topTen: mockStore.leaderboard,
      userRank,
    },
  }
}
