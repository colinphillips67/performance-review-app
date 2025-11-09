import api from './api'

/**
 * Review Cycle Service
 * API calls for review cycle management
 */

/**
 * Get all review cycles
 * @param {string} [status] - Filter by status (planning, active, completed, cancelled)
 * @returns {Promise<Array>} Array of review cycles
 */
export const getAllCycles = async (status = null) => {
  const params = status ? { status } : {}
  const response = await api.get('/review-cycles', { params })
  return response.data
}

/**
 * Get active review cycle
 * @returns {Promise<Object|null>} Active cycle or null
 */
export const getActiveCycle = async () => {
  try {
    const response = await api.get('/review-cycles/active')
    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Get review cycle by ID
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<Object>} Review cycle
 */
export const getCycleById = async (cycleId) => {
  const response = await api.get(`/review-cycles/${cycleId}`)
  return response.data
}

/**
 * Create new review cycle
 * @param {Object} cycleData - Cycle data
 * @param {string} cycleData.name - Cycle name
 * @param {string} [cycleData.description] - Cycle description
 * @param {string} cycleData.startDate - Start date (ISO string)
 * @param {string} cycleData.endDate - End date (ISO string)
 * @returns {Promise<Object>} Created review cycle
 */
export const createCycle = async (cycleData) => {
  const response = await api.post('/review-cycles', cycleData)
  return response.data
}

/**
 * Update review cycle
 * @param {string} cycleId - Cycle UUID
 * @param {Object} cycleData - Data to update
 * @returns {Promise<Object>} Updated review cycle
 */
export const updateCycle = async (cycleId, cycleData) => {
  const response = await api.put(`/review-cycles/${cycleId}`, cycleData)
  return response.data
}

/**
 * Launch review cycle (set status to active)
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<Object>} Updated review cycle
 */
export const launchCycle = async (cycleId) => {
  const response = await api.post(`/review-cycles/${cycleId}/launch`)
  return response.data
}

/**
 * Cancel review cycle
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<Object>} Updated review cycle
 */
export const cancelCycle = async (cycleId) => {
  const response = await api.post(`/review-cycles/${cycleId}/cancel`)
  return response.data
}

/**
 * Get cycle status
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<Object>} Cycle status
 */
export const getCycleStatus = async (cycleId) => {
  const response = await api.get(`/review-cycles/${cycleId}/status`)
  return response.data
}

/**
 * Get participants for a cycle
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<Array>} Array of participants
 */
export const getParticipants = async (cycleId) => {
  const response = await api.get(`/review-cycles/${cycleId}/participants`)
  return response.data
}

/**
 * Add participants to cycle
 * @param {string} cycleId - Cycle UUID
 * @param {Array<string>} userIds - Array of user UUIDs
 * @returns {Promise<Object>} Result with count
 */
export const addParticipants = async (cycleId, userIds) => {
  const response = await api.post(`/review-cycles/${cycleId}/participants`, { userIds })
  return response.data
}

export default {
  getAllCycles,
  getActiveCycle,
  getCycleById,
  createCycle,
  updateCycle,
  launchCycle,
  cancelCycle,
  getCycleStatus,
  getParticipants,
  addParticipants
}
