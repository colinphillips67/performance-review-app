import api from './api'

export const authService = {
  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise} Response may include requiresTwoFactor flag
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  /**
   * Logout current user
   */
  async logout() {
    await api.post('/auth/logout')
  },

  /**
   * Validate current session
   * @returns {Promise} User data if session is valid
   */
  async validateSession() {
    const response = await api.get('/auth/session')
    return response.data.user
  },

  /**
   * Register a new user (admin only)
   * @param {Object} userData - User data
   */
  async register(userData) {
    const response = await api.post('/users', userData)
    return response.data
  },

  /**
   * Request password reset email
   * @param {string} email
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  /**
   * Reset/change password (for authenticated users)
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/reset-password', { currentPassword, newPassword })
    return response.data
  },

  /**
   * Setup 2FA - generates secret and QR code
   * @returns {Promise} Contains secret and qrCodeUrl
   */
  async setup2FA() {
    const response = await api.post('/auth/setup-2fa')
    return response.data
  },

  /**
   * Verify 2FA token
   * @param {string} token - 6-digit code from authenticator
   * @param {string} secret - Secret (when enabling 2FA)
   * @param {string} userId - User ID (when logging in with 2FA)
   */
  async verify2FA(token, secret = null, userId = null) {
    const response = await api.post('/auth/verify-2fa', { token, secret, userId })
    return response.data
  },

  /**
   * Disable 2FA
   * @param {string} password - User's password for confirmation
   */
  async disable2FA(password) {
    const response = await api.post('/auth/disable-2fa', { password })
    return response.data
  }
}
