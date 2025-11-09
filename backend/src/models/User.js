import { query } from '../config/database.js';

/**
 * User Model
 * Handles all database operations related to users
 */

/**
 * Find user by email
 * @param {string} email - User's email
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Find user by ID
 * @param {string} userId - User's UUID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findById = async (userId) => {
  const result = await query(
    'SELECT * FROM users WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User's email
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.jobTitle - User's job title
 * @param {string} userData.passwordHash - Hashed password
 * @param {boolean} [userData.isAdmin=false] - Whether user is an admin
 * @returns {Promise<Object>} Created user object (without password hash)
 */
export const create = async (userData) => {
  const { email, firstName, lastName, jobTitle, passwordHash, isAdmin = false } = userData;

  const result = await query(
    `INSERT INTO users (email, first_name, last_name, job_title, password_hash, is_admin)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id, email, first_name, last_name, job_title, is_admin, is_active,
               two_fa_enabled, created_at, updated_at`,
    [email, firstName, lastName, jobTitle, passwordHash, isAdmin]
  );

  return result.rows[0];
};

/**
 * Update user's last login timestamp
 * @param {string} userId - User's UUID
 * @returns {Promise<void>}
 */
export const updateLastLogin = async (userId) => {
  await query(
    `UPDATE users SET last_login = NOW() AT TIME ZONE 'UTC' WHERE user_id = $1`,
    [userId]
  );
};

/**
 * Update user's password
 * @param {string} userId - User's UUID
 * @param {string} passwordHash - New hashed password
 * @returns {Promise<void>}
 */
export const updatePassword = async (userId, passwordHash) => {
  await query(
    'UPDATE users SET password_hash = $1 WHERE user_id = $2',
    [passwordHash, userId]
  );
};

/**
 * Update user's 2FA settings
 * @param {string} userId - User's UUID
 * @param {boolean} enabled - Whether 2FA is enabled
 * @param {string|null} secret - 2FA secret (null if disabling)
 * @returns {Promise<void>}
 */
export const update2FA = async (userId, enabled, secret = null) => {
  await query(
    'UPDATE users SET two_fa_enabled = $1, two_fa_secret = $2 WHERE user_id = $3',
    [enabled, secret, userId]
  );
};

/**
 * Get all active users
 * @returns {Promise<Array>} Array of users (without password hashes)
 */
export const getAllActive = async () => {
  const result = await query(
    `SELECT user_id, email, first_name, last_name, job_title, is_admin, is_active,
            two_fa_enabled, created_at, updated_at, last_login
     FROM users
     WHERE is_active = true
     ORDER BY last_name, first_name`
  );
  return result.rows;
};

/**
 * Deactivate a user (soft delete)
 * @param {string} userId - User's UUID
 * @returns {Promise<void>}
 */
export const deactivate = async (userId) => {
  await query(
    'UPDATE users SET is_active = false WHERE user_id = $1',
    [userId]
  );
};

/**
 * Activate a user
 * @param {string} userId - User's UUID
 * @returns {Promise<void>}
 */
export const activate = async (userId) => {
  await query(
    'UPDATE users SET is_active = true WHERE user_id = $1',
    [userId]
  );
};

/**
 * Update user information
 * @param {string} userId - User's UUID
 * @param {Object} userData - User data to update
 * @param {string} [userData.firstName] - User's first name
 * @param {string} [userData.lastName] - User's last name
 * @param {string} [userData.jobTitle] - User's job title
 * @param {boolean} [userData.isAdmin] - Whether user is an admin
 * @param {boolean} [userData.isActive] - Whether user is active
 * @returns {Promise<Object>} Updated user object (without password hash)
 */
export const update = async (userId, userData) => {
  const { firstName, lastName, jobTitle, isAdmin, isActive } = userData;

  const result = await query(
    `UPDATE users
     SET first_name = $1, last_name = $2, job_title = $3, is_admin = $4, is_active = $5
     WHERE user_id = $6
     RETURNING user_id, email, first_name, last_name, job_title, is_admin, is_active,
               two_fa_enabled, created_at, updated_at, last_login`,
    [firstName, lastName, jobTitle, isAdmin, isActive, userId]
  );

  return result.rows[0];
};

/**
 * Delete a user (hard delete)
 * Deletes all associated sessions first, then the user
 * @param {string} userId - User's UUID
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  // First delete all sessions for this user
  await query(
    'DELETE FROM sessions WHERE user_id = $1',
    [userId]
  );

  // Then delete the user
  await query(
    'DELETE FROM users WHERE user_id = $1',
    [userId]
  );
};

export default {
  findByEmail,
  findById,
  create,
  updateLastLogin,
  updatePassword,
  update2FA,
  getAllActive,
  deactivate,
  activate,
  update,
  deleteUser
};
