import { useState, useEffect } from 'react'
import './App.css'

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
      <div className="container">
        <div className="box">
          <h2>Results</h2>
          <div className="results-section">
            <div className="question-content">
              <strong>Question:</strong>
              <p>{question.question}</p>
            </div>
            <div className="answer-content">
              <strong>Your Answer:</strong>
              <p>{answer}</p>
            </div>
            <div className="feedback-content">
              <strong>Feedback:</strong>
              <p>{feedback}</p>
            </div>
          </div>
          <div className="button-group">
            <button type="button" onClick={handleNewQuestion} className="btn-primary">
              New Question
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (page === 'question' && question) {
    return (
      <div className="container">
        <div className="box">
          <h2>Question</h2>
          <div className="question-content">
            <p>{question.question}</p>
          </div>
          <div className="form-group">
            <label>Your Answer:</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              placeholder="Type your answer here..."
            />
          </div>
          <div className="button-group">
            <button type="button" onClick={handleBackToSetup} className="btn-secondary" disabled={loading}>
              Back
            </button>
            <button type="button" onClick={handleSubmitAnswer} className="btn-primary" disabled={loading || !answer.trim()}>
              {loading ? 'Evaluating...' : 'Submit Answer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="box">
        <h1>DevOps Quiz</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category">Category:</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!category || loading}
            >
              <option value="">Select a subject</option>
              {subjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty:</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              disabled={loading}
            >
              <option value={1}>Easy</option>
              <option value={2}>Medium</option>
              <option value={3}>Hard</option>
            </select>
          </div>

          <div className="button-group">
            <button type="button" onClick={handleClear} className="btn-secondary" disabled={loading}>
              Clear
            </button>
            <button type="submit" className="btn-primary" disabled={!category || !subject || loading}>
              {loading ? 'Loading...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
