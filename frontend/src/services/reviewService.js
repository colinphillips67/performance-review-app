import api from './api'

/**
 * Review Service
 * API calls for review management
 */

/**
 * Save review as draft (create or update)
 * @param {Object} reviewData - Review data
 * @param {string} reviewData.reviewCycleId - Review cycle UUID
 * @param {string} reviewData.revieweeId - Reviewee UUID
 * @param {string} reviewData.reviewType - Type: 'self', 'peer_360', or 'manager'
 * @param {string} reviewData.content - Review content
 * @returns {Promise<Object>} Saved review
 */
export const saveReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData)
  return response.data
}

/**
 * Submit a review
 * @param {string} reviewId - Review UUID
 * @returns {Promise<Object>} Submission result
 */
export const submitReview = async (reviewId) => {
  const response = await api.post(`/reviews/${reviewId}/submit`)
  return response.data
}

/**
 * Get a specific review
 * @param {string} reviewId - Review UUID
 * @returns {Promise<Object>} Review data
 */
export const getReview = async (reviewId) => {
  const response = await api.get(`/reviews/${reviewId}`)
  return response.data
}

/**
 * Get all reviews for current user
 * @param {string} [cycleId] - Optional cycle ID to filter
 * @returns {Promise<Array>} Array of reviews
 */
export const getMyReviews = async (cycleId = null) => {
  const params = cycleId ? { cycleId } : {}
  const response = await api.get('/reviews/my-reviews', { params })
  return response.data
}

/**
 * Get all reviews for a specific employee
 * @param {string} employeeId - Employee UUID
 * @param {string} cycleId - Review cycle UUID
 * @returns {Promise<Array>} Array of reviews
 */
export const getEmployeeReviews = async (employeeId, cycleId) => {
  const response = await api.get(`/reviews/employee/${employeeId}`, {
    params: { cycleId }
  })
  return response.data
}

/**
 * Release manager review to employee
 * @param {string} reviewId - Review UUID
 * @returns {Promise<Object>} Release result
 */
export const releaseReview = async (reviewId) => {
  const response = await api.post(`/reviews/${reviewId}/release`)
  return response.data
}

/**
 * Revert review to draft (admin only)
 * @param {string} reviewId - Review UUID
 * @returns {Promise<Object>} Revert result
 */
export const revertReview = async (reviewId) => {
  const response = await api.post(`/reviews/${reviewId}/revert`)
  return response.data
}

export default {
  saveReview,
  submitReview,
  getReview,
  getMyReviews,
  getEmployeeReviews,
  releaseReview,
  revertReview
}
