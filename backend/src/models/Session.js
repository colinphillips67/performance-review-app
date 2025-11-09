import { query } from '../config/database.js';

/**
 * Session Model
 * Handles all database operations related to user sessions
 */

/**
 * Create a new session
 * @param {Object} sessionData - Session data
 * @param {string} sessionData.userId - User's UUID
 * @param {string} sessionData.token - JWT token
 * @param {Date} sessionData.expiresAt - Expiration timestamp
 * @param {string} [sessionData.ipAddress] - IP address
 * @param {string} [sessionData.userAgent] - User agent string
 * @returns {Promise<Object>} Created session object
 */
export const create = async (sessionData) => {
  const { userId, token, expiresAt, ipAddress, userAgent } = sessionData;

  // Convert expiresAt to a timestamp without timezone (assumes input is UTC)
  const expiresAtUTC = expiresAt.toISOString().replace('T', ' ').replace('Z', '');

  const result = await query(
    `INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING session_id, user_id, token, created_at, expires_at, last_activity`,
    [userId, token, expiresAtUTC, ipAddress || null, userAgent || null]
  );

  return result.rows[0];
};

/**
 * Find session by token
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} Session object or null if not found
 */
export const findByToken = async (token) => {
  const result = await query(
    `SELECT * FROM sessions
     WHERE token = $1 AND expires_at > NOW() AT TIME ZONE 'UTC'`,
    [token]
  );
  return result.rows[0] || null;
};

/**
 * Update session activity
 * @param {string} token - JWT token
 * @returns {Promise<void>}
 */
export const updateActivity = async (token) => {
  await query(
    `UPDATE sessions
     SET last_activity = NOW() AT TIME ZONE 'UTC'
     WHERE token = $1`,
    [token]
  );
};

/**
 * Delete session by token (logout)
 * @param {string} token - JWT token
 * @returns {Promise<void>}
 */
export const deleteByToken = async (token) => {
  await query(
    'DELETE FROM sessions WHERE token = $1',
    [token]
  );
};

/**
 * Delete all sessions for a user
 * @param {string} userId - User's UUID
 * @returns {Promise<void>}
 */
export const deleteAllForUser = async (userId) => {
  await query(
    'DELETE FROM sessions WHERE user_id = $1',
    [userId]
  );
};

/**
 * Delete expired sessions (cleanup)
 * @returns {Promise<number>} Number of deleted sessions
 */
export const deleteExpired = async () => {
  const result = await query(
    `DELETE FROM sessions WHERE expires_at <= NOW() AT TIME ZONE 'UTC'`
  );
  return result.rowCount;
};

/**
 * Get all active sessions for a user
 * @param {string} userId - User's UUID
 * @returns {Promise<Array>} Array of sessions
 */
export const getActiveForUser = async (userId) => {
  const result = await query(
    `SELECT session_id, created_at, expires_at, last_activity, ip_address, user_agent
     FROM sessions
     WHERE user_id = $1 AND expires_at > NOW() AT TIME ZONE 'UTC'
     ORDER BY last_activity DESC`,
    [userId]
  );
  return result.rows;
};

export default {
  create,
  findByToken,
  updateActivity,
  deleteByToken,
  deleteAllForUser,
  deleteExpired,
  getActiveForUser
};
