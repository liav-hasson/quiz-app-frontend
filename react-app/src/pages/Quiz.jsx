import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import AnimatedBorder from '@/components/AnimatedBorder'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function Quiz() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

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

  const handleLogout = () => {
    logout()
    navigate('/login')
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
        <Header user={user} onLogout={handleLogout} />
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
        <Header user={user} onLogout={handleLogout} />
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

  return (
    <>
      <Header user={user} onLogout={handleLogout} />
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1E293B',
          color: '#E8EAF6',
          border: '1px solid rgba(0, 217, 255, 0.3)',
        },
      }} />
      <div className="min-h-screen flex items-center justify-center p-5 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          <AnimatedBorder>
            <Card className="bg-slate/95 backdrop-blur-xl border-purple/30 shadow-2xl shadow-purple/20 hover:shadow-purple/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-linear-to-r from-cyan via-purple-light to-purple bg-clip-text text-transparent"
                    style={{
                      background: 'linear-gradient(135deg, #00D9FF 0%, #A78BFA 50%, #7C3AED 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    DevOps Quiz
                  </motion.div>
                </CardTitle>
              </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Label htmlFor="category" className="text-cyan text-sm font-semibold uppercase tracking-wide">
                    Category
                  </Label>
                  <Select value={category} onValueChange={setCategory} disabled={loading}>
                    <SelectTrigger 
                      id="category"
                      className="w-full bg-slate-light/50 backdrop-blur-sm border-2 border-purple/30 text-silver focus:ring-2 focus:ring-cyan focus:border-cyan"
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="subject" className="text-cyan text-sm font-semibold uppercase tracking-wide">
                    Subject
                  </Label>
                  <Select value={subject} onValueChange={setSubject} disabled={!category || loading}>
                    <SelectTrigger 
                      id="subject"
                      className="w-full bg-slate-light/50 backdrop-blur-sm border-2 border-purple/30 text-silver focus:ring-2 focus:ring-cyan focus:border-cyan disabled:opacity-50"
                    >
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subj => (
                        <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="difficulty" className="text-cyan text-sm font-semibold uppercase tracking-wide">
                    Difficulty
                  </Label>
                  <Select value={difficulty.toString()} onValueChange={(val) => setDifficulty(Number(val))} disabled={loading}>
                    <SelectTrigger 
                      id="difficulty"
                      className="w-full bg-slate-light/50 backdrop-blur-sm border-2 border-purple/30 text-silver focus:ring-2 focus:ring-cyan focus:border-cyan"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Easy</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-3 pt-4"
                >
                  <Button 
                    type="button" 
                    onClick={handleClear}
                    variant="outline"
                    className="flex-1 bg-slate-light/50 hover:bg-slate-light text-silver border-purple/30 hover:border-purple/50 font-semibold shadow-md hover:shadow-lg transition-all backdrop-blur-sm"
                    size="lg"
                    disabled={loading}
                  >
                    Clear
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-linear-to-r from-cyan to-purple hover:from-cyan-dark hover:to-purple-dark text-white font-semibold shadow-lg shadow-purple/30 hover:shadow-purple/50 transition-all"
                    size="lg"
                    disabled={!category || !subject || loading}
                  >
                    {loading ? 'Loading...' : 'Generate Question'}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
          </AnimatedBorder>
        </motion.div>
      </div>
    </>
  )
}
