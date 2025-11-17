import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AnimatedBackground from './components/AnimatedBackground'
import Login from './pages/Login'
import Quiz from './pages/Quiz'

export default function App() {
  const [page, setPage] = useState('setup')
  const [categories, setCategories] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  // Test comment for dev pipeline
  
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
      .catch(err => {
        console.error('Failed to fetch categories:', err)
        toast.error('Failed to load categories')
      })
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
      .catch(err => {
        console.error('Failed to fetch subjects:', err)
        toast.error('Failed to load subjects')
      })
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
        toast.error('Failed to generate question. Backend may not be configured.')
        return
      }
      
      const data = await res.json()
      console.log('Received question data:', data)
      
      if (data.question) {
        setQuestion(data)
        setPage('question')
        toast.success('Question generated!')
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch (err) {
      console.error('Failed to generate question:', err)
      toast.error('Failed to connect to backend. Please check the server.')
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
      toast.error('Please enter an answer')
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
        toast.error('Failed to evaluate answer')
        return
      }

      const data = await res.json()
      console.log('Received feedback:', data)

      if (data.feedback) {
        setFeedback(data.feedback)
        setPage('results')
        toast.success('Answer evaluated!')
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch (err) {
      console.error('Failed to evaluate answer:', err)
      toast.error('Failed to connect to backend')
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
      <>
        <AnimatedBackground />
        <Header />
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#1E293B',
            color: '#E8EAF6',
            border: '1px solid rgba(0, 217, 255, 0.3)',
          },
        }} />
        <div className="min-h-screen flex items-center justify-center p-5 pt-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl"
          >
            <AnimatedBorder delay={1}>
              <Card className="bg-slate/95 backdrop-blur-xl border-purple/30 shadow-2xl shadow-purple/20 hover:shadow-purple/30 transition-all duration-300">
                <CardHeader>
                <CardTitle className="text-3xl font-bold text-center text-silver flex items-center justify-center gap-3">
                  <motion.span
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    📊
                  </motion.span>
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Label className="text-cyan text-sm font-semibold uppercase tracking-wide">Question</Label>
                  <Card className="bg-slate-light/50 backdrop-blur-sm border-cyan/20 mt-2">
                    <CardContent className="pt-4">
                      <p className="text-silver leading-relaxed">{question.question}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <Separator className="bg-purple/30" />

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label className="text-cyan text-sm font-semibold uppercase tracking-wide">Your Answer</Label>
                  <Card className="bg-slate-light/50 backdrop-blur-sm border-cyan/20 mt-2">
                    <CardContent className="pt-4">
                      <p className="text-silver leading-relaxed">{answer}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <Separator className="bg-purple/30" />

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label className="text-purple-light text-sm font-semibold uppercase tracking-wide">Feedback</Label>
                  <Card className="bg-linear-to-br from-purple/10 to-cyan/10 backdrop-blur-sm border-purple/40 mt-2 border-2 shadow-lg shadow-purple/10">
                    <CardContent className="pt-4">
                      <p className="text-silver leading-relaxed whitespace-pre-wrap">{feedback}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button 
                  onClick={handleNewQuestion}
                  className="flex-1 bg-linear-to-r from-cyan to-purple hover:from-cyan-dark hover:to-purple-dark text-white font-semibold shadow-lg shadow-purple/30 hover:shadow-purple/50 transition-all"
                  size="lg"
                >
                  New Question
                </Button>
              </CardFooter>
            </Card>
            </AnimatedBorder>
          </motion.div>
        </div>
      </>
    )
  }

  if (page === 'question' && question) {
    return (
      <>
        <AnimatedBackground />
        <Header />
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#1E293B',
            color: '#E8EAF6',
            border: '1px solid rgba(0, 217, 255, 0.3)',
          },
        }} />
        <div className="min-h-screen flex items-center justify-center p-5 pt-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl"
          >
            <AnimatedBorder delay={0.5}>
              <Card className="bg-slate/95 backdrop-blur-xl border-purple/30 shadow-2xl shadow-purple/20 hover:shadow-purple/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-center text-silver flex items-center justify-center gap-3">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    🤔
                  </motion.span>
                  Question
                  <Badge variant="secondary" className="ml-2 bg-purple/20 text-purple-light border-purple/40">
                    {difficulty === 1 ? 'Easy' : difficulty === 2 ? 'Medium' : 'Hard'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative"
                >
                  {/* Animated border wrapper */}
                  <motion.div
                    className="absolute -inset-px bg-linear-to-r from-cyan via-purple to-cyan rounded-lg opacity-0"
                    animate={{
                      opacity: [0, 0.5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <Card className="relative bg-linear-to-br from-cyan/10 to-purple/10 backdrop-blur-sm border-cyan/40 border-2 shadow-lg shadow-cyan/10">
                    <CardContent className="pt-6">
                      <p className="text-silver text-lg leading-relaxed">{question.question}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="answer" className="text-cyan text-sm font-semibold uppercase tracking-wide">
                    Your Answer
                  </Label>
                  <Textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[200px] bg-slate-light/50 backdrop-blur-sm border-2 border-purple/30 text-silver placeholder:text-silver/40 focus:ring-2 focus:ring-cyan focus:border-cyan resize-none"
                  />
                </motion.div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button 
                  onClick={handleBackToSetup}
                  variant="outline"
                  className="flex-1 bg-slate-light/50 hover:bg-slate-light text-silver border-purple/30 hover:border-purple/50 font-semibold shadow-md hover:shadow-lg transition-all backdrop-blur-sm"
                  size="lg"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmitAnswer}
                  className="flex-1 bg-linear-to-r from-cyan to-purple hover:from-cyan-dark hover:to-purple-dark text-white font-semibold shadow-lg shadow-purple/30 hover:shadow-purple/50 transition-all"
                  size="lg"
                  disabled={loading || !answer.trim()}
                >
                  {loading ? 'Evaluating...' : 'Submit Answer'}
                </Button>
              </CardFooter>
            </Card>
            </AnimatedBorder>
          </motion.div>
        </div>
      </>
    )
  }

export default function App() {
  return (
    <>
      {/* AnimatedBackground is always visible */}
      <AnimatedBackground />
      
      {/* Routes are rendered on top of the background */}
      <div className="relative z-10">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/quiz" replace />} />
          <Route path="*" element={<Navigate to="/quiz" replace />} />
        </Routes>
      </div>
    </>
  )
}
