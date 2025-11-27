# 🎭 Mock API Mode - Frontend Development Without Backend

Work on the frontend without running the backend! Perfect for UI development, fast iteration, and demos.

---

## 🚀 Quick Start

### Enable Mock Mode (3 steps)
```bash
cd quiz-app-frontend/react-app
echo "VITE_USE_MOCK_API=true" > .env
npm run dev
```

**That's it!** You'll see: `🎭 Using Mock API - No backend required!`

### Switch to Real Backend
```bash
echo "VITE_USE_MOCK_API=false" > .env
echo "VITE_API_BASE_URL=http://localhost:5000" >> .env
npm run dev
```

---

## 📦 What You Get with Mock Mode

**Pre-loaded data:**
- ✅ **4 Categories:** DevOps, Programming, Cloud, Networking
- ✅ **20+ Subjects:** Kubernetes, Docker, Python, AWS, etc.
- ✅ **50+ Questions:** Pre-written for each subject
- ✅ **Mock User:** mock.user@example.com (auto-login)
- ✅ **15 History Entries:** Random past answers with scores
- ✅ **30 Days Performance:** Mock score trends
- ✅ **Top 10 Leaderboard:** Realistic user rankings

**Realistic behavior:**
- ✅ Simulated delays (login: 0.8s, questions: 1.5s, evaluation: 2s)
- ✅ Random score generation based on difficulty
- ✅ Works completely offline

---

## 🎯 When to Use Each Mode

| Scenario | Mock API | Real Backend |
|----------|----------|--------------|
| **UI/styling work** | ✅ Perfect | ❌ Overkill |
| **Component development** | ✅ Perfect | ❌ Overkill |
| **Fast iteration** | ✅ Instant | ❌ Slow startup |
| **Demos/presentations** | ✅ Easy | ❌ Setup hassle |
| **Integration testing** | ❌ Limited | ✅ Required |
| **AI features** | ❌ Pre-written only | ✅ Real AI |
| **Data persistence** | ❌ Lost on refresh | ✅ Saved to DB |
| **Authentication** | ❌ Mock token | ✅ Real OAuth |

**Rule of thumb:** Use mock for UI work, use real backend for integration testing.

---

## ⚙️ Customizing Mock Data

Edit `react-app/src/api/mockAPI.js`:

### Add Categories/Subjects
```javascript
const mockStore = {
  categories: {
    'DevOps': ['CI/CD', 'Kubernetes', 'Docker'],
    'Security': ['Pentesting', 'Cryptography'],  // Add your own!
  }
}
```

### Add Questions
```javascript
const mockQuestions = {
  'DevOps': {
    'Kubernetes': [
      'What is a pod?',
      'Your new question here?',  // Add more!
    ]
  }
}
```

### Adjust Response Speed
```javascript
// Make faster (development)
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))

// Make slower (test loading states)
const delay = (ms = 3000) => new Promise(resolve => setTimeout(resolve, ms))
```

### Change Mock Scores
```javascript
const getRandomScore = (difficulty) => {
  const baseScore = 9  // Always high scores
  return Math.floor(baseScore + Math.random() * 1)
}
```

---

## 🔧 How It Works

The `quizAPI.js` file automatically switches based on environment variable:

```javascript
// In src/api/quizAPI.js
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

if (USE_MOCK_API) {
  console.log('🎭 Using Mock API - No backend required!')
  export * from './mockAPI.js'  // Use fake data
} else {
  // Use real API calls
}
```

**Your components don't change at all!** Same imports, same code.

---

## 🧪 Testing Different Scenarios

### Test Loading States
```javascript
// In mockAPI.js
const delay = (ms = 5000) => ...  // 5 second delay
// Now you can see loading spinners!
```

### Test Error States
```javascript
// In mockAPI.js
export async function generateQuestion(...) {
  await delay(1000)
  
  // Simulate 30% failure rate
  if (Math.random() < 0.3) {
    return {
      ok: false,
      status: 500,
      error: 'Mock error: AI service unavailable'
    }
  }
  
  return { ...normalResponse }
}
```

### Test Empty States
```javascript
export async function getUserHistory() {
  return { history: [] }  // Empty history
}
```

---

## 🐛 Troubleshooting

### Mock mode not working?
```bash
# 1. Check .env
cat .env | grep VITE_USE_MOCK_API
# Should show: VITE_USE_MOCK_API=true

# 2. Restart dev server (Vite needs restart for env changes)
npm run dev

# 3. Check browser console
# Should see: 🎭 Using Mock API - No backend required!
```

### Still trying to connect to backend?
```bash
# Hard refresh browser
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+F5
```

### Login not working?
```javascript
// Clear localStorage in browser console
localStorage.clear()
// Then try login again
```

### Mock data not updating?
- Save `mockAPI.js` file
- Hard refresh browser (Cmd+Shift+R)

---

## 💡 Pro Tips

**Tip 1: Use for rapid prototyping**
```bash
# Iterate on UI without waiting for backend
VITE_USE_MOCK_API=true npm run dev
```

**Tip 2: Perfect for demos**
```bash
# Show stakeholders progress without complex setup
VITE_USE_MOCK_API=true npm run dev
# Just open browser and go!
```

**Tip 3: Multiple .env files**
```bash
# Keep both configs
.env.mock     # Mock mode config
.env.local    # Real backend config

# Switch quickly
cp .env.mock .env    # Use mock
cp .env.local .env   # Use real
```

**Tip 4: Adjust delays during development**
```javascript
// Fast for development
const delay = (ms = 0) => Promise.resolve()

// Realistic for demos
const delay = (ms = 500) => new Promise(...)

// Slow to test loading UI
const delay = (ms = 5000) => new Promise(...)
```

---

## 📂 Files Involved

- `react-app/src/api/mockAPI.js` - Mock data and responses
- `react-app/src/api/quizAPI.js` - Auto-switches between mock/real
- `react-app/.env` - Configuration (`VITE_USE_MOCK_API=true/false`)

---

## 🎓 Development Workflow

### Day 1-3: Build UI with mock data
```bash
VITE_USE_MOCK_API=true npm run dev
# Focus on: components, styling, interactions
```

### Day 4-5: Test with real backend
```bash
VITE_USE_MOCK_API=false npm run dev

# Start backend:
cd ../quiz-app-backend && docker-compose up -d

# Test: API integration, auth flow, error handling
```

---

## 📊 Mock vs Real Comparison

| Feature | Mock API | Real Backend |
|---------|----------|--------------|
| Setup time | 5 seconds | 5-10 minutes |
| Backend required | ❌ No | ✅ Yes |
| MongoDB required | ❌ No | ✅ Yes |
| Network calls | ❌ None (instant) | ✅ Yes |
| Data persistence | ❌ Lost on refresh | ✅ Saved to DB |
| AI questions | ❌ Pre-written | ✅ Real AI |
| OAuth | ❌ Mock token | ✅ Real Google |

---

## ✅ Summary

**Enable mock mode:**
```bash
echo "VITE_USE_MOCK_API=true" > .env
```

**Benefits:**
- ⚡ Instant startup (no backend needed)
- 🎨 Perfect for UI development
- 🚀 Fast iteration
- 🎭 Great for demos
- 📴 Works offline

**When to switch to real backend:**
- Integration testing
- Testing AI features
- Testing authentication
- Final testing before deployment

---

## 🆘 Need Help?

- **Check console:** Should see `🎭 Using Mock API - No backend required!`
- **Verify .env:** Run `cat .env | grep VITE_USE_MOCK_API`
- **Restart:** Run `npm run dev` after changing `.env`
- **Clear cache:** Hard refresh browser (Cmd+Shift+R)

Happy coding! 🎉
