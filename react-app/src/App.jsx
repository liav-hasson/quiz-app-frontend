import { useState, useEffect } from 'react'

export default function App() {
  const [page, setPage] = useState('setup')
  const [categories, setCategories] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [difficulty, setDifficulty] = useState(1)
  
  // Question state
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories))
      .catch(err => console.error('Failed to fetch categories:', err))
  }, [])

  // Fetch subjects when category changes
  useEffect(() => {
    if (!category) {
      setSubjects([])
      setSubject('')
      return
    }
    fetch(`/api/subjects?category=${category}`)
      .then(res => res.json())
      .then(data => {
        setSubjects(data.subjects)
        setSubject('')
      })
      .catch(err => console.error('Failed to fetch subjects:', err))
  }, [category])

  const handleClear = () => {
    setCategory('')
    setSubject('')
    setDifficulty(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!category || !subject) return

    setLoading(true)
    try {
      const res = await fetch('/api/question/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, difficulty })
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('API Error:', res.status, errorText)
        alert(`Error: ${res.status} - Failed to generate question. Backend may not be configured.`)
        return
      }
      
      const data = await res.json()
      console.log('Received question data:', data)
      
      if (data.question) {
        setQuestion(data)
        setPage('question')
      } else if (data.error) {
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      console.error('Failed to generate question:', err)
      alert('Failed to connect to backend. Please check the server.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToSetup = () => {
    setPage('setup')
    setQuestion(null)
    setAnswer('')
    setFeedback(null)
  }

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      alert('Please enter an answer')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/answer/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          answer: answer,
          difficulty: question.difficulty
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('API Error:', res.status, errorText)
        alert(`Error: ${res.status} - Failed to evaluate answer`)
        return
      }

      const data = await res.json()
      console.log('Received feedback:', data)

      if (data.feedback) {
        setFeedback(data.feedback)
        setPage('results')
      } else if (data.error) {
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      console.error('Failed to evaluate answer:', err)
      alert('Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  const handleNewQuestion = () => {
    setPage('setup')
    setQuestion(null)
    setAnswer('')
    setFeedback(null)
  }

  if (page === 'results' && feedback) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-5">
        <div className="bg-lime-cream shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-12 w-full max-w-2xl aspect-square flex flex-col transition-all duration-300 hover:shadow-[0_30px_60px_rgba(0,0,0,0.7)] hover:scale-[1.02]">
          <h2 className="text-3xl font-bold text-center text-graphite mb-6">Results</h2>
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="bg-white p-4">
              <strong className="text-graphite text-sm font-semibold uppercase tracking-wide">Question:</strong>
              <p className="text-graphite mt-2 leading-relaxed">{question.question}</p>
            </div>
            <div className="bg-white p-4">
              <strong className="text-graphite text-sm font-semibold uppercase tracking-wide">Your Answer:</strong>
              <p className="text-graphite mt-2 leading-relaxed">{answer}</p>
            </div>
            <div className="bg-white p-4">
              <strong className="text-graphite text-sm font-semibold uppercase tracking-wide">Feedback:</strong>
              <p className="text-graphite mt-2 leading-relaxed">{feedback}</p>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button 
              type="button" 
              onClick={handleNewQuestion} 
              className="flex-1 bg-yellow hover:bg-graphite hover:text-white text-graphite font-semibold py-3 px-6 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              New Question
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (page === 'question' && question) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-5">
        <div className="bg-lime-cream shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-12 w-full max-w-2xl aspect-square flex flex-col transition-all duration-300 hover:shadow-[0_30px_60px_rgba(0,0,0,0.7)] hover:scale-[1.02]">
          <h2 className="text-3xl font-bold text-center text-graphite mb-6">Question</h2>
          <div className="bg-white p-5 mb-6">
            <p className="text-graphite text-lg leading-relaxed">{question.question}</p>
          </div>
          <div className="mb-6 flex-1 flex flex-col">
            <label className="block text-graphite text-sm font-semibold uppercase tracking-wide mb-2">Your Answer:</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="flex-1 w-full px-4 py-3 bg-white border-2 border-graphite text-graphite placeholder-graphite/50 focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={handleBackToSetup} 
              className="flex-1 bg-graphite hover:bg-black text-white font-semibold py-3 px-6 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loading}
            >
              Back
            </button>
            <button 
              type="button" 
              onClick={handleSubmitAnswer} 
              className="flex-1 bg-yellow hover:bg-graphite hover:text-white text-graphite font-semibold py-3 px-6 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loading || !answer.trim()}
            >
              {loading ? 'Evaluating...' : 'Submit Answer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div className="bg-lime-cream shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-12 w-full max-w-2xl aspect-square flex flex-col transition-all duration-50 hover:shadow-[0_30px_60px_rgba(0,0,0,0.7)] hover:scale-[1.005]">
        <h1 className="text-4xl font-bold text-center text-graphite mb-8">DevOps Quiz</h1>
        <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
          <div className="flex-1 space-y-6">
            <div>
              <label htmlFor="category" className="block text-graphite text-sm font-semibold uppercase tracking-wide mb-2">
                Category:
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-white border-2 border-graphite text-graphite focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-graphite text-sm font-semibold uppercase tracking-wide mb-2">
                Subject:
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!category || loading}
                className="w-full px-4 py-3 bg-white border-2 border-graphite text-graphite focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a subject</option>
                {subjects.map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-graphite text-sm font-semibold uppercase tracking-wide mb-2">
                Difficulty:
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                disabled={loading}
                className="w-full px-4 py-3 bg-white border-2 border-graphite text-graphite focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value={1}>Easy</option>
                <option value={2}>Medium</option>
                <option value={3}>Hard</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={handleClear} 
              className="flex-1 bg-graphite hover:bg-black text-white font-semibold py-3 px-6 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loading}
            >
              Clear
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-yellow hover:bg-graphite hover:text-white text-graphite font-semibold py-3 px-6 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={!category || !subject || loading}
            >
              {loading ? 'Loading...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
