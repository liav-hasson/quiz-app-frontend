import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import themeReducer from './slices/themeSlice'
import quizReducer from './slices/quizSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    quiz: quizReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export default store
