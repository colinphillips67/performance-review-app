/**
 * Test Helper Functions
 *
 * Provides utility functions for testing, including authentication helpers
 * to obtain JWT tokens for testing protected endpoints.
 */

import request from 'supertest';
import app from '../src/index.js';
import * as authService from '../src/services/authService.js';
import * as User from '../src/models/User.js';

/**
 * Login as admin user and return authentication token
 * @returns {Promise<string>} JWT authentication token
 */
export async function loginAsAdmin() {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@example.com',
      password: 'AdminPassword123!'
    });

  if (!response.body.token) {
    throw new Error('Failed to get admin token: ' + JSON.stringify(response.body));
  }

  return response.body.token;
}

/**
 * Login as regular user and return authentication token
 * @param {string} email - User email (defaults to test user)
 * @param {string} password - User password (defaults to test password)
 * @returns {Promise<string>} JWT authentication token
 */
export async function loginAsUser(email = 'john.doe@example.com', password = 'Password123!') {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (!response.body.token) {
    throw new Error('Failed to get user token: ' + JSON.stringify(response.body));
  }

  return response.body.token;
}

/**
 * Create a test user and return the user object
 * @param {object} userData - User data (email, password, firstName, lastName, jobTitle, isAdmin)
 * @returns {Promise<object>} Created user object
 */
export async function createTestUser(userData = {}) {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    jobTitle: 'Software Engineer',
    isAdmin: false
  };

  const mergedData = { ...defaultData, ...userData };
  const user = await authService.register(mergedData);

  return user;
}

/**
 * Create a test user and return both the user and their auth token
 * @param {object} userData - User data
 * @returns {Promise<{user: object, token: string}>} User object and auth token
 */
export async function createTestUserWithToken(userData = {}) {
  const user = await createTestUser(userData);
  const token = await loginAsUser(user.email, userData.password || 'TestPassword123!');

  return { user, token };
}

/**
 * Delete a test user by email
 * @param {string} email - User email to delete
 */
export async function deleteTestUser(email) {
  const user = await User.findByEmail(email);
  if (user) {
    await User.deleteById(user.user_id);
  }
}

/**
 * Clean up all test users (emails starting with 'test-')
 */
export async function cleanupTestUsers() {
  const { query } = await import('../src/config/database.js');
  await query("DELETE FROM users WHERE email LIKE 'test-%'");
}

/**
 * Setup 2FA for a user and return the secret
 * @param {string} userId - User ID
 * @returns {Promise<{secret: string, qrCode: string}>} 2FA secret and QR code
 */
export async function setup2FAForUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const result = await authService.generate2FASecret(user);
  return result;
}

/**
 * Enable 2FA for a user
 * @param {string} userId - User ID
 * @param {string} secret - 2FA secret
 * @param {string} token - TOTP token
 */
export async function enable2FAForUser(userId, secret, token) {
  await authService.enable2FA(userId, token, secret);
}
