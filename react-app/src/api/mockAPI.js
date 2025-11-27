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
    { rank: 6, username: 'Mock User', score: 580, _id: '6' },
    { rank: 7, username: 'Grace', score: 550, _id: '7' },
    { rank: 8, username: 'Hank', score: 520, _id: '8' },
    { rank: 9, username: 'Ivy', score: 490, _id: '9' },
    { rank: 10, username: 'Jack', score: 460, _id: '10' },
  ],
}

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Level system data
const levelData = [
  { level: 1, name: 'Novice', xpRequired: 0, description: 'Just starting your learning journey' },
  { level: 2, name: 'Beginner', xpRequired: 100, description: 'Taking your first steps' },
  { level: 3, name: 'Learner', xpRequired: 300, description: 'Building foundational knowledge' },
  { level: 4, name: 'Student', xpRequired: 600, description: 'Actively studying and practicing' },
  { level: 5, name: 'Practitioner', xpRequired: 1000, description: 'Applying knowledge in practice' },
  { level: 6, name: 'Specialist', xpRequired: 1500, description: 'Developing specialized skills' },
  { level: 7, name: 'Professional', xpRequired: 2100, description: 'Working with professional proficiency' },
  { level: 8, name: 'Expert', xpRequired: 2800, description: 'Demonstrating expert-level mastery' },
  { level: 9, name: 'Master', xpRequired: 3600, description: 'Achieving mastery in your field' },
  { level: 10, name: 'Virtuoso', xpRequired: 4500, description: 'Exceptional skill and artistry' },
  { level: 11, name: 'Guru', xpRequired: 5500, description: 'Teaching and guiding others' },
  { level: 12, name: 'Legend', xpRequired: 6600, description: 'Legendary achievements and recognition' },
  { level: 13, name: 'Mythic', xpRequired: 7800, description: 'Reaching mythical status' },
  { level: 14, name: 'Transcendent', xpRequired: 9100, description: 'Transcending ordinary boundaries' },
  { level: 15, name: 'Immortal', xpRequired: 10500, description: 'Achieving immortal status' },
]

// Calculate level from XP using progressive curve
const calculateLevel = (xp) => {
  if (xp < 0) return levelData[0]
  
  // Find the highest level where xpRequired <= user's XP
  for (let i = levelData.length - 1; i >= 0; i--) {
    if (xp >= levelData[i].xpRequired) {
      return levelData[i]
    }
  }
  
  return levelData[0]
}

// Calculate progress to next level
const calculateLevelProgress = (xp) => {
  const currentLevelData = calculateLevel(xp)
  const currentLevelIndex = levelData.findIndex(l => l.level === currentLevelData.level)
  
  if (currentLevelIndex === levelData.length - 1) {
    // Already at max level
    return {
      currentLevelXP: currentLevelData.xpRequired,
      nextLevelXP: currentLevelData.xpRequired,
      xpIntoLevel: xp - currentLevelData.xpRequired,
      xpNeeded: 0,
      progressPercentage: 100
    }
  }
  
  const nextLevelData = levelData[currentLevelIndex + 1]
  const xpIntoLevel = xp - currentLevelData.xpRequired
  const xpNeeded = nextLevelData.xpRequired - currentLevelData.xpRequired
  const progressPercentage = Math.min(100, (xpIntoLevel / xpNeeded) * 100)
  
  return {
    currentLevelXP: currentLevelData.xpRequired,
    nextLevelXP: nextLevelData.xpRequired,
    nextLevelName: nextLevelData.name,
    xpIntoLevel,
    xpNeeded,
    progressPercentage: Math.round(progressPercentage * 10) / 10
  }
}

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
    picture: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EMock User%3C/text%3E%3C/svg%3E',
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
  return mockStore.categories
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
  const categories = Object.keys(mockStore.categories)
  
  // Generate mock history - ensure all categories are represented at least once
  for (let i = 0; i < Math.min(limit, 15); i++) {
    // For the first 4 entries, use each category once to guarantee representation
    const randomCategory = i < categories.length 
      ? categories[i] 
      : categories[Math.floor(Math.random() * categories.length)]
    
    const subjects = mockStore.categories[randomCategory]
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)]
    const randomDifficulty = Math.floor(Math.random() * 3) + 1
    
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    history.push({
      id: 'h-' + i,
      summary: {
        category: randomCategory,
        subject: randomSubject,
        difficulty: randomDifficulty,
        score: getRandomScore(randomDifficulty),
        created_at: date.toISOString(),
      },
      details: {
        question: mockQuestions[randomCategory]?.[randomSubject]?.[0] || 'Sample question?',
        answer: 'This is a mock answer for testing purposes.',
        keyword: randomSubject,
        evaluation: {
          feedback: 'Good work! Keep learning and practicing.',
        },
        metadata: {
          category: randomCategory,
          subject: randomSubject,
          difficulty: randomDifficulty,
        },
      },
    })
  }
  
  // Return just the history array to match real API behavior
  return history
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
  
  // Return just the performance array to match real API behavior
  return performance
}

/**
 * Mock get user profile
 */
export async function getUserProfile() {
  await delay(300)
  
  const XP = 1250
  const levelInfo = calculateLevel(XP)
  const levelProgress = calculateLevelProgress(XP)
  
  const profile = {
    XP,
    level: levelInfo.level,
    levelName: levelInfo.name,
    levelDescription: levelInfo.description,
    bestCategory: 'DevOps',
    totalAnswers: 23,
    averageScore: 7.5,
    lastActivity: new Date().toISOString(),
    levelProgress,
  }
  
  // Return just the profile data to match real API behavior
  return profile
}

/**
 * Mock get user best category
 */
export async function getUserBestCategory() {
  await delay(200)
  
  // Return an object with bestCategory to match real API behavior
  return { bestCategory: 'DevOps' }
}

/**
 * Mock get leaderboard
 */
export async function getLeaderboard() {
  await delay(400)
  
  // Get current user from localStorage (since mockStore.user might not persist)
  const userStr = localStorage.getItem('quiz_user')
  const currentUser = userStr ? JSON.parse(userStr) : mockStore.user
  
  if (!currentUser) {
    return {
      topTen: mockStore.leaderboard,
      userRank: null,
    }
  }
  
  // Find user in leaderboard by name or email
  const userInLeaderboard = mockStore.leaderboard.find(
    entry => entry.username === currentUser?.name || entry.username === currentUser?.email
  )
  
  let userRank = null
  if (userInLeaderboard) {
    userRank = userInLeaderboard.rank
  } else {
    // User not in top 10, assign rank 15
    userRank = 15
  }
  
  // Return clean data matching real API behavior
  return {
    topTen: mockStore.leaderboard,
    userRank,
  }
}
