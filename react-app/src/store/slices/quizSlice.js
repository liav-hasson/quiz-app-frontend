import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as quizAPI from '../../api/quizAPI'

/**
 * Quiz Slice - Manages all quiz-related state and logic
 * Centralizes quiz setup, question generation, and answer evaluation
 */

// Async thunks for API calls
export const fetchCategoriesWithSubjects = createAsyncThunk(
  'quiz/fetchCategoriesWithSubjects',
  async (_, { rejectWithValue }) => {
    try {
      return await quizAPI.getCategoriesWithSubjects()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const generateQuestion = createAsyncThunk(
  'quiz/generateQuestion',
  async ({ category, subject, difficulty }, { rejectWithValue }) => {
    try {
      return await quizAPI.generateQuestion(category, subject, difficulty)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const submitAnswer = createAsyncThunk(
  'quiz/submitAnswer',
  async ({ question, answer, difficulty }, { rejectWithValue, getState }) => {
    try {
      const evaluation = await quizAPI.evaluateAnswer(question, answer, difficulty)
      const state = getState().quiz
      const currentQuestion = state.currentQuestion || {}
      const category = currentQuestion.category || state.selectedCategory
      const subject = currentQuestion.subject || state.selectedSubject
      const keyword = currentQuestion.keyword
      const timestamp = new Date().toISOString()

      let historyEntry = null

      if (category && subject) {
        const historyPayload = {
          question,
          answer,
          difficulty,
          category,
          subject,
          keyword,
          score: evaluation.score,
          evaluation: { feedback: evaluation.feedback },
          metadata: {
            submitted_at: timestamp,
            source: 'quiz-app',
          },
        }

        try {
          const response = await quizAPI.saveAnswerHistory(historyPayload)
          historyEntry = {
            id: response.answer_id,
            summary: {
              category,
              subject,
              difficulty,
              score: evaluation.score,
              keyword,
              created_at: timestamp,
            },
            details: {
              question,
              answer,
              evaluation: historyPayload.evaluation,
              metadata: historyPayload.metadata,
            },
          }
        } catch (err) {
          console.error('Failed to save answer history:', err)
          // History save failed but evaluation succeeded - continue
          // User will still see their score but it won't be in history
        }
      }

      return { ...evaluation, historyEntry }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchUserHistory = createAsyncThunk(
  'quiz/fetchUserHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await quizAPI.getUserHistory(params)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const quizSlice = createSlice({
  name: 'quiz',
  initialState: {
    // Setup form state
    categories: [],
    subjects: [],
    categoriesWithSubjects: {}, // Cache for all categories with their subjects
    selectedCategory: '',
    selectedSubject: '',
    selectedDifficulty: 1,
    
    // Question state
    currentQuestion: null,
    userAnswer: '',
    feedback: null,
    score: null,
    
    // UI state
    currentPage: 'setup', // 'setup' | 'question' | 'results'
    loading: false,
    error: null,

    // History state
    history: [],
    historyLoading: false,
    historyError: null,
    historyLoaded: false,
  },
  reducers: {
    // Form actions
    setCategory: (state, action) => {
      state.selectedCategory = action.payload
      state.selectedSubject = '' // Reset subject when category changes
      // Load subjects from cache if available
      if (state.categoriesWithSubjects[action.payload]) {
        state.subjects = state.categoriesWithSubjects[action.payload]
      } else {
        state.subjects = []
      }
    },
    setSubject: (state, action) => {
      state.selectedSubject = action.payload
    },
    setDifficulty: (state, action) => {
      state.selectedDifficulty = action.payload
    },
    setUserAnswer: (state, action) => {
      state.userAnswer = action.payload
    },
    
    // Navigation actions
    goToSetup: (state) => {
      state.currentPage = 'setup'
      state.currentQuestion = null
      state.userAnswer = ''
      state.feedback = null
      state.score = null
      state.error = null
    },
    goToQuestion: (state) => {
      state.currentPage = 'question'
    },
    goToResults: (state) => {
      state.currentPage = 'results'
    },
    
    // Reset actions
    clearForm: (state) => {
      state.selectedCategory = ''
      state.selectedSubject = ''
      state.selectedDifficulty = 1
    },
    resetQuiz: (state) => {
      state.currentQuestion = null
      state.userAnswer = ''
      state.feedback = null
      state.score = null
      state.currentPage = 'setup'
      state.error = null
    },
    clearHistory: (state) => {
      state.history = []
      state.historyLoading = false
      state.historyError = null
      state.historyLoaded = false
    },
  },
  extraReducers: (builder) => {
    // Fetch categories with subjects (combined, more efficient)
    builder
      .addCase(fetchCategoriesWithSubjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategoriesWithSubjects.fulfilled, (state, action) => {
        state.loading = false
        state.categoriesWithSubjects = action.payload
        state.categories = Object.keys(action.payload)
        // If a category is already selected, update subjects from cache
        if (state.selectedCategory && action.payload[state.selectedCategory]) {
          state.subjects = action.payload[state.selectedCategory]
        }
      })
      .addCase(fetchCategoriesWithSubjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
    
    // Generate question
    builder
      .addCase(generateQuestion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generateQuestion.fulfilled, (state, action) => {
        state.loading = false
        state.currentQuestion = action.payload
        state.currentPage = 'question'
      })
      .addCase(generateQuestion.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
    
    // Submit answer
    builder
      .addCase(submitAnswer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.loading = false
        state.feedback = action.payload.feedback
        state.score = action.payload.score
        state.currentPage = 'results'
        const historyEntry = action.payload.historyEntry
        if (historyEntry?.summary?.category && historyEntry?.summary?.subject) {
          const exists = state.history.findIndex((entry) => entry.id === historyEntry.id)
          if (exists === -1) {
            state.history = [historyEntry, ...state.history].slice(0, 50)
          } else {
            // Consistent immutable update pattern
            state.history = [
              ...state.history.slice(0, exists),
              historyEntry,
              ...state.history.slice(exists + 1)
            ]
          }
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    builder
      .addCase(fetchUserHistory.pending, (state) => {
        state.historyLoading = true
        state.historyError = null
      })
      .addCase(fetchUserHistory.fulfilled, (state, action) => {
        state.historyLoading = false
        // Merge local unsaved entries with fetched history
        const fetched = action.payload || []
        // Find local entries not present in fetched (by id)
        const fetchedIds = new Set(fetched.map(entry => entry.id))
        const localUnsaved = state.history.filter(entry => !fetchedIds.has(entry.id))
        // Prepend local unsaved entries to fetched history (or append, as desired)
        state.history = [...localUnsaved, ...fetched].slice(0, 50)
        state.historyLoaded = true
      })
      .addCase(fetchUserHistory.rejected, (state, action) => {
        state.historyLoading = false
        state.historyError = action.payload
        state.historyLoaded = false
      })
  },
})

export const {
  setCategory,
  setSubject,
  setDifficulty,
  setUserAnswer,
  goToSetup,
  goToQuestion,
  goToResults,
  clearForm,
  resetQuiz,
  clearHistory,
} = quizSlice.actions

// Selectors - Easy access to quiz state
export const selectCategories = (state) => state.quiz.categories
export const selectSubjects = (state) => state.quiz.subjects
export const selectCategoriesWithSubjects = (state) => state.quiz.categoriesWithSubjects
export const selectSelectedCategory = (state) => state.quiz.selectedCategory
export const selectSelectedSubject = (state) => state.quiz.selectedSubject
export const selectSelectedDifficulty = (state) => state.quiz.selectedDifficulty
export const selectCurrentQuestion = (state) => state.quiz.currentQuestion
export const selectUserAnswer = (state) => state.quiz.userAnswer
export const selectFeedback = (state) => state.quiz.feedback
export const selectScore = (state) => state.quiz.score
export const selectCurrentPage = (state) => state.quiz.currentPage
export const selectLoading = (state) => state.quiz.loading
export const selectError = (state) => state.quiz.error
export const selectHistory = (state) => state.quiz.history
export const selectHistoryLoading = (state) => state.quiz.historyLoading
export const selectHistoryError = (state) => state.quiz.historyError
export const selectHistoryLoaded = (state) => state.quiz.historyLoaded

export default quizSlice.reducer
