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
  },
  {
    // Prevent duplicate fetches when a request is already in-flight or
    // when data is already loaded. Pass `{ force: true }` in params to
    // bypass this guard and force a re-fetch.
    condition: (params = {}, { getState }) => {
      const state = getState()
      const quiz = state.quiz || {}
      if (quiz.historyLoading) return false
      if (quiz.historyLoaded && !params.force) return false
      return true
    },
  }
)

export const fetchUserProfile = createAsyncThunk(
  'quiz/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await quizAPI.getUserProfile()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchUserBestCategory = createAsyncThunk(
  'quiz/fetchUserBestCategory',
  async (_, { rejectWithValue }) => {
    try {
      return await quizAPI.getUserBestCategory()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
  {
    condition: (_arg, { getState }) => {
      const state = getState()
      const quiz = state.quiz || {}
      if (quiz.bestCategoryLoading) return false
      if (quiz.bestCategoryLoaded) return false
      return true
    },
  }
)

export const fetchUserPerformance = createAsyncThunk(
  'quiz/fetchUserPerformance',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await quizAPI.getUserPerformance(params)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
  {
    condition: (params = {}, { getState }) => {
      const state = getState()
      const quiz = state.quiz || {}
      if (quiz.performanceLoading) return false
      if (quiz.performanceLoaded && !params.force) return false
      return true
    },
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

    // User profile stats (XP, bestCategory, etc.)
    userProfile: null,
    userProfileLoading: false,
    userProfileError: null,
    userProfileLoaded: false,

    // Best category (server provided) - DEPRECATED: use userProfile.bestCategory
    bestCategory: null,
    bestCategoryLoading: false,
    bestCategoryError: null,
    bestCategoryLoaded: false,

    // Performance data for charts
    performance: [],
    performanceLoading: false,
    performanceError: null,
    performanceLoaded: false,

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
        state.userAnswer = ''
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
        // Ensure fetched is always an array
        let fetched = action.payload
        if (!Array.isArray(fetched)) {
          if (fetched && typeof fetched === 'object') {
            fetched = [fetched]
          } else {
            fetched = []
          }
        }
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

    // User Profile (XP, bestCategory, stats)
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.userProfileLoading = true
        state.userProfileError = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.userProfileLoading = false
        state.userProfile = action.payload
        state.userProfileLoaded = true
        state.userProfileError = null
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.userProfileLoading = false
        state.userProfileError = action.payload || 'Failed to fetch user profile'
        state.userProfileLoaded = true
      })

      // Best category (server-provided) - DEPRECATED: use fetchUserProfile
      builder
        .addCase(fetchUserBestCategory.pending, (state) => {
          state.bestCategoryLoading = true
          state.bestCategoryError = null
          state.bestCategoryLoaded = false
        })
        .addCase(fetchUserBestCategory.fulfilled, (state, action) => {
          state.bestCategoryLoading = false
          // Accept string value or try to coerce common shapes. If the backend
          // returns a nested object, attempt to extract a string value. If
          // extraction fails keep null but mark as loaded so we don't keep
          // refetching indefinitely.
          if (typeof action.payload === 'string') {
            state.bestCategory = action.payload
          } else if (action.payload && typeof action.payload === 'object') {
            const v = action.payload.bestCategory || action.payload.best_category || action.payload.category || null
            state.bestCategory = typeof v === 'string' ? v : null
          } else {
            state.bestCategory = null
          }
          state.bestCategoryLoaded = true
        })
        .addCase(fetchUserBestCategory.rejected, (state, action) => {
          state.bestCategoryLoading = false
          state.bestCategoryError = action.payload
          state.bestCategory = null
          state.bestCategoryLoaded = true
        })

      // Performance data
      builder
        .addCase(fetchUserPerformance.pending, (state) => {
          state.performanceLoading = true
          state.performanceError = null
        })
        .addCase(fetchUserPerformance.fulfilled, (state, action) => {
          state.performanceLoading = false
          // Normalize payload to array if possible. If API returned an error object
          // (e.g., { ok: false, error: '...' }) convert to empty array so UI
          // components receive a predictable array shape.
          const payload = action.payload
          let arr = []
          if (Array.isArray(payload)) {
            arr = payload
          } else if (payload && Array.isArray(payload.performance)) {
            arr = payload.performance
          } else if (payload && Array.isArray(payload.data)) {
            arr = payload.data
          } else {
            arr = []
          }
          state.performance = arr
          state.performanceLoaded = true
        })
        .addCase(fetchUserPerformance.rejected, (state, action) => {
          state.performanceLoading = false
          state.performanceError = action.payload
          state.performanceLoaded = false
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

// User Profile selectors
export const selectUserProfile = (state) => state.quiz.userProfile
export const selectUserProfileLoading = (state) => state.quiz.userProfileLoading
export const selectUserProfileError = (state) => state.quiz.userProfileError
export const selectUserProfileLoaded = (state) => state.quiz.userProfileLoaded

// Best Category selectors (deprecated - use selectUserProfile)
export const selectBestCategory = (state) => state.quiz.bestCategory
export const selectBestCategoryLoading = (state) => state.quiz.bestCategoryLoading
export const selectBestCategoryError = (state) => state.quiz.bestCategoryError
export const selectBestCategoryLoaded = (state) => state.quiz.bestCategoryLoaded

export const selectPerformance = (state) => state.quiz.performance
export const selectPerformanceLoading = (state) => state.quiz.performanceLoading
export const selectPerformanceLoaded = (state) => state.quiz.performanceLoaded

export default quizSlice.reducer
