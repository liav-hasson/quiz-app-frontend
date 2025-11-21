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

export const fetchCategories = createAsyncThunk(
  'quiz/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await quizAPI.getCategories()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchSubjects = createAsyncThunk(
  'quiz/fetchSubjects',
  async (category, { rejectWithValue }) => {
    try {
      return await quizAPI.getSubjects(category)
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
  async ({ question, answer, difficulty }, { rejectWithValue }) => {
    try {
      return await quizAPI.evaluateAnswer(question, answer, difficulty)
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
    
    // Fetch categories (fallback, less efficient)
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.categories = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
    
    // Fetch subjects (fallback for individual category)
    builder
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.loading = false
        state.subjects = action.payload
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
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
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
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

export default quizSlice.reducer
