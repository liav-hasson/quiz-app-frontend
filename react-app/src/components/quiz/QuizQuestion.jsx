import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import AnimatedBorder from '@/components/AnimatedBorder'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

import {
  selectCurrentQuestion,
  selectUserAnswer,
  selectSelectedDifficulty,
  selectLoading,
  setUserAnswer,
  goToSetup,
  submitAnswer,
} from '@/store/slices/quizSlice'

/**
 * QuizQuestion Component
 * Displays the generated question and answer input
 */
export default function QuizQuestion() {
  const dispatch = useDispatch()
  
  const currentQuestion = useSelector(selectCurrentQuestion)
  const userAnswer = useSelector(selectUserAnswer)
  const difficulty = useSelector(selectSelectedDifficulty)
  const loading = useSelector(selectLoading)

  const difficultyLabel = difficulty === 1 ? 'Easy' : difficulty === 2 ? 'Medium' : 'Hard'

  const handleAnswerChange = (e) => {
    dispatch(setUserAnswer(e.target.value))
  }

  const handleBack = () => {
    dispatch(goToSetup())
  }

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      toast.error('Please enter an answer')
      return
    }

    try {
      await dispatch(
        submitAnswer({
          question: currentQuestion.question,
          answer: userAnswer,
          difficulty: difficulty,
        })
      ).unwrap()
      
      toast.success('Answer evaluated!')
    } catch (error) {
      console.error('Failed to evaluate answer:', error)
    }
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <AnimatedBorder delay={0.5}>
      <Card className="quiz-question-card">
        <CardHeader>
          <CardTitle className="quiz-question-title flex items-center justify-center gap-3">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              🤔
            </motion.span>
            Question
            <Badge variant="secondary" className="quiz-question-difficulty-badge ml-2">
              {difficultyLabel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="quiz-question-content">
          {/* Question Display */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <motion.div
              className="quiz-question-glow"
              animate={{
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <Card className="quiz-question-inner-card">
              <CardContent className="quiz-question-inner-content">
                <p className="quiz-question-text">{currentQuestion.question}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Answer Input */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="answer" className="quiz-question-label">
              Your Answer
            </Label>
            <Textarea
              id="answer"
              name="answer"
              value={userAnswer}
              onChange={handleAnswerChange}
              placeholder="Type your answer here..."
              className="quiz-question-textarea"
            />
          </motion.div>
        </CardContent>
        <CardFooter className="quiz-question-footer">
          <Button 
            onClick={handleBack}
            variant="outline"
            className="quiz-question-back-btn"
            size="lg"
            disabled={loading}
          >
            Back
          </Button>
          <Button 
            onClick={handleSubmit}
            className="quiz-setup-generate-btn"
            size="lg"
            disabled={loading || !userAnswer.trim()}
          >
            <span>{loading ? 'Evaluating...' : 'Submit Answer'}</span>
          </Button>
        </CardFooter>
      </Card>
    </AnimatedBorder>
  )
}
