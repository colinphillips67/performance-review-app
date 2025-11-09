import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      // Don't redirect if we're already on the login page or if this is a session validation request
      if (error.response.status === 401) {
        const isSessionValidation = error.config?.url?.includes('/auth/session')
        const isLoginPage = window.location.pathname === '/login'

        if (!isSessionValidation && !isLoginPage) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
      }

      // Extract error message
      const errorMessage = error.response.data?.error?.message || 'An error occurred'
      error.message = errorMessage
    } else if (error.request) {
      error.message = 'No response from server. Please check your connection.'
    } else {
      error.message = 'An unexpected error occurred'
    }

    return Promise.reject(error)
  }
)

export default api
