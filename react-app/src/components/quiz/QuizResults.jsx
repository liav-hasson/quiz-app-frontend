import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import AnimatedBorder from '@/components/AnimatedBorder'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

import {
  selectCurrentQuestion,
  selectUserAnswer,
  selectFeedback,
  selectScore,
  selectSelectedDifficulty,
  selectSelectedCategory,
  selectSelectedSubject,
  resetQuiz,
  goToSetup,
  setDifficulty,
  generateQuestion,
} from '@/store/slices/quizSlice'

/**
 * QuizResults Component
 * Displays the question, user's answer, and AI feedback
 */
export default function QuizResults() {
  const dispatch = useDispatch()
  
  const currentQuestion = useSelector(selectCurrentQuestion)
  const userAnswer = useSelector(selectUserAnswer)
  const feedback = useSelector(selectFeedback)
  const score = useSelector(selectScore)
  const difficulty = useSelector(selectSelectedDifficulty)
  const category = useSelector(selectSelectedCategory)
  const subject = useSelector(selectSelectedSubject)

  const difficultyLabel = difficulty === 1 ? 'Easy' : difficulty === 2 ? 'Medium' : 'Hard'
  
  const getDifficultyClass = () => {
    if (difficulty === 1) return 'quiz-difficulty-easy'
    if (difficulty === 2) return 'quiz-difficulty-medium'
    return 'quiz-difficulty-hard'
  }

  const handleNewQuestion = async () => {
    // Generate a new question with the same parameters
    try {
      await dispatch(
        generateQuestion({
          category,
          subject,
          difficulty,
        })
      ).unwrap()
    } catch (error) {
      console.error('Failed to generate question:', error)
    }
  }

  const handleNextLevel = async () => {
    // Increase difficulty and generate new question
    const newDifficulty = difficulty + 1
    try {
      dispatch(setDifficulty(newDifficulty))
      await dispatch(
        generateQuestion({
          category,
          subject,
          difficulty: newDifficulty,
        })
      ).unwrap()
    } catch (error) {
      console.error('Failed to generate question:', error)
    }
  }

  const handleBack = () => {
    dispatch(goToSetup())
  }

  if (!currentQuestion || !feedback) {
    return null
  }

  return (
    <AnimatedBorder delay={1}>
      <Card className="quiz-results-card">
        <CardHeader>
          <CardTitle className="quiz-results-title">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              Your Score: <span className="font-bold text-5xl">{score || 'N/A'}</span>
            </motion.div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Label className="quiz-results-label">Question</Label>
              <div className={`quiz-difficulty-badge ${getDifficultyClass()}`}>
                {difficultyLabel}
              </div>
            </div>
            <Card className="quiz-results-inner-card">
              <CardContent className="quiz-results-inner-content">
                <p className="quiz-results-question-text">{currentQuestion.question}</p>
              </CardContent>
            </Card>
          </motion.div>

          <Separator className="quiz-results-separator" />

          {/* User Answer */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Label className="quiz-results-label">Your Answer</Label>
            <Card className="quiz-results-inner-card mt-2">
              <CardContent className="quiz-results-inner-content">
                <p className="quiz-results-answer-text">{userAnswer}</p>
              </CardContent>
            </Card>
          </motion.div>

          <Separator className="quiz-results-separator" />

          {/* Feedback */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Label className="quiz-results-label">Feedback</Label>
            <Card className="quiz-results-feedback-card mt-2">
              <CardContent className="quiz-results-feedback-content">
                <p className="quiz-results-feedback-text whitespace-pre-wrap">{feedback}</p>
              </CardContent>
            </Card>
          </motion.div>
        </CardContent>
        <CardFooter className="quiz-results-footer flex-col gap-3">
          <div className="flex gap-3 w-full">
            <Button 
              onClick={handleBack}
              variant="outline"
              className="quiz-question-back-btn flex-1"
              size="lg"
            >
              Back
            </Button>
            {difficulty < 3 && (
              <Button 
                onClick={handleNextLevel}
                variant="outline"
                className="quiz-setup-generate-btn flex-1"
                size="lg"
              >
                Next Level
              </Button>
            )}
          </div>
          <Button 
            onClick={handleNewQuestion}
            variant="outline"
            className="quiz-setup-generate-btn w-full"
            size="lg"
          >
            <span>New Question (Same Subject)</span>
          </Button>
        </CardFooter>
      </Card>
    </AnimatedBorder>
  )
}
