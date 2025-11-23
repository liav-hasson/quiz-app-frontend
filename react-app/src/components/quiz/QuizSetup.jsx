import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import AnimatedBorder from '@/components/AnimatedBorder'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import {
  selectCategories,
  selectSubjects,
  selectSelectedCategory,
  selectSelectedSubject,
  selectSelectedDifficulty,
  selectLoading,
  selectCategoriesWithSubjects,
  setCategory,
  setSubject,
  setDifficulty,
  clearForm,
  generateQuestion,
} from '@/store/slices/quizSlice'

/**
 * QuizSetup Component
 * Handles the initial quiz configuration (category, subject, difficulty)
 * Now uses cached categories with subjects for better performance
 */
export default function QuizSetup() {
  const dispatch = useDispatch()
  
  const categories = useSelector(selectCategories)
  const subjects = useSelector(selectSubjects)
  const selectedCategory = useSelector(selectSelectedCategory)
  const selectedSubject = useSelector(selectSelectedSubject)
  const selectedDifficulty = useSelector(selectSelectedDifficulty)
  const loading = useSelector(selectLoading)
  const categoriesWithSubjects = useSelector(selectCategoriesWithSubjects)

  // Subjects are now loaded from cache when category is selected
  // No need for separate API call

  const handleCategoryChange = (value) => {
    dispatch(setCategory(value))
  }

  const handleSubjectChange = (value) => {
    dispatch(setSubject(value))
  }

  const handleDifficultyChange = (value) => {
    dispatch(setDifficulty(Number(value)))
  }

  const handleClear = () => {
    dispatch(clearForm())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedCategory || !selectedSubject) {
      toast.error('Please select both category and subject')
      return
    }

    try {
      await dispatch(
        generateQuestion({
          category: selectedCategory,
          subject: selectedSubject,
          difficulty: selectedDifficulty,
        })
      ).unwrap()
      
      toast.success('Question generated!')
    } catch (error) {
      // Error already shown via useEffect in parent
      console.error('Failed to generate question:', error)
    }
  }

  return (
    <AnimatedBorder>
      <Card className="quiz-setup-card">
        <CardHeader>
          <CardTitle className="quiz-setup-title">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="quiz-setup-title-gradient"
            >
              DevOps Quiz
            </motion.div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <Label htmlFor="category" className="quiz-setup-label">
                Category
              </Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange} disabled={loading}>
                <SelectTrigger 
                  id="category"
                  className="quiz-setup-select"
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

            {/* Subject Selection */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <Label htmlFor="subject" className="quiz-setup-label">
                Subject
              </Label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange} disabled={!selectedCategory || loading}>
                <SelectTrigger 
                  id="subject"
                  className="quiz-setup-select"
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

            {/* Difficulty Selection */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="difficulty" className="quiz-setup-label">
                Difficulty
              </Label>
              <Select value={selectedDifficulty.toString()} onValueChange={handleDifficultyChange} disabled={loading}>
                <SelectTrigger 
                  id="difficulty"
                  className="quiz-setup-select"
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

            {/* Action Buttons */}
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
                className="quiz-setup-clear-btn"
                size="lg"
                disabled={loading}
              >
                Clear
              </Button>
              <Button 
                type="submit"
                variant="outline"
                className="quiz-setup-generate-btn"
                size="lg"
                disabled={!selectedCategory || !selectedSubject || loading}
              >
                <span>{loading ? 'Loading...' : 'Generate Question'}</span>
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </AnimatedBorder>
  )
}
