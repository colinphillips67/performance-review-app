import { query } from '../config/database.js';

/**
 * ReviewCycleParticipant Model
 * Handles all database operations related to review cycle participants
 */

/**
 * Add participant to review cycle
 * @param {Object} participantData - Participant data
 * @param {string} participantData.cycleId - Cycle UUID
 * @param {string} participantData.userId - User UUID
 * @param {string} [participantData.managerId] - Manager's UUID
 * @returns {Promise<Object>} Created participant record
 */
export const addParticipant = async (participantData) => {
  const { cycleId, userId, managerId = null } = participantData;

  const result = await query(
    `INSERT INTO review_cycle_participants (cycle_id, user_id, manager_id)
     VALUES ($1, $2, $3)
     RETURNING participant_id, cycle_id, user_id, manager_id, assigned_peers_count, created_at`,
    [cycleId, userId, managerId]
  );

  return result.rows[0];
};

/**
 * Add multiple participants to review cycle
 * @param {string} cycleId - Cycle UUID
 * @param {Array<Object>} participants - Array of participant data
 * @returns {Promise<Array>} Array of created participant records
 */
export const addMultipleParticipants = async (cycleId, participants) => {
  if (!participants || participants.length === 0) {
    return [];
  }

  // Build VALUES clause for bulk insert
  const values = participants.map((p, index) => {
    const baseIndex = index * 3;
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
  }).join(', ');

  // Flatten parameters
  const params = participants.flatMap(p => [cycleId, p.userId, p.managerId || null]);

  const result = await query(
    `INSERT INTO review_cycle_participants (cycle_id, user_id, manager_id)
     VALUES ${values}
     RETURNING participant_id, cycle_id, user_id, manager_id, assigned_peers_count, created_at`,
    params
  );

  return result.rows;
};

/**
 * Remove participant from review cycle
 * @param {string} cycleId - Cycle UUID
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
export const removeParticipant = async (cycleId, userId) => {
  await query(
    'DELETE FROM review_cycle_participants WHERE cycle_id = $1 AND user_id = $2',
    [cycleId, userId]
  );
};

/**
 * Get all participants for a review cycle
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<Array>} Array of participants with user details
 */
export const getParticipants = async (cycleId) => {
  const result = await query(
    `SELECT
       rcp.participant_id,
       rcp.cycle_id,
       rcp.user_id,
       rcp.manager_id,
       rcp.assigned_peers_count,
       rcp.created_at,
       u.email,
       u.first_name,
       u.last_name,
       u.job_title,
       m.email as manager_email,
       m.first_name as manager_first_name,
       m.last_name as manager_last_name
     FROM review_cycle_participants rcp
     JOIN users u ON rcp.user_id = u.user_id
     LEFT JOIN users m ON rcp.manager_id = m.user_id
     WHERE rcp.cycle_id = $1
     ORDER BY u.last_name, u.first_name`,
    [cycleId]
  );

  return result.rows;
};

/**
 * Check if user is participant in cycle
 * @param {string} cycleId - Cycle UUID
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} True if user is participant
 */
export const isParticipant = async (cycleId, userId) => {
  const result = await query(
    'SELECT 1 FROM review_cycle_participants WHERE cycle_id = $1 AND user_id = $2',
    [cycleId, userId]
  );

  return result.rows.length > 0;
};

/**
 * Get participant details
 * @param {string} cycleId - Cycle UUID
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} Participant details or null
 */
export const getParticipant = async (cycleId, userId) => {
  const result = await query(
    `SELECT
       rcp.*,
       u.email,
       u.first_name,
       u.last_name,
       u.job_title
     FROM review_cycle_participants rcp
     JOIN users u ON rcp.user_id = u.user_id
     WHERE rcp.cycle_id = $1 AND rcp.user_id = $2`,
    [cycleId, userId]
  );

  return result.rows[0] || null;
};

/**
 * Update participant's manager
 * @param {string} cycleId - Cycle UUID
 * @param {string} userId - User UUID
 * @param {string|null} managerId - Manager's UUID
 * @returns {Promise<Object>} Updated participant record
 */
export const updateManager = async (cycleId, userId, managerId) => {
  const result = await query(
    `UPDATE review_cycle_participants
     SET manager_id = $1
     WHERE cycle_id = $2 AND user_id = $3
     RETURNING participant_id, cycle_id, user_id, manager_id, assigned_peers_count, created_at`,
    [managerId, cycleId, userId]
  );

  return result.rows[0];
};

/**
 * Increment assigned peers count
 * @param {string} cycleId - Cycle UUID
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
export const incrementAssignedPeersCount = async (cycleId, userId) => {
  await query(
    `UPDATE review_cycle_participants
     SET assigned_peers_count = assigned_peers_count + 1
     WHERE cycle_id = $1 AND user_id = $2`,
    [cycleId, userId]
  );
};

/**
 * Decrement assigned peers count
 * @param {string} cycleId - Cycle UUID
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
export const decrementAssignedPeersCount = async (cycleId, userId) => {
  await query(
    `UPDATE review_cycle_participants
     SET assigned_peers_count = GREATEST(assigned_peers_count - 1, 0)
     WHERE cycle_id = $1 AND user_id = $2`,
    [cycleId, userId]
  );
};

/**
 * Get participant count for a cycle
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<number>} Number of participants
 */
export const getParticipantCount = async (cycleId) => {
  const result = await query(
    'SELECT COUNT(*) as count FROM review_cycle_participants WHERE cycle_id = $1',
    [cycleId]
  );

  return parseInt(result.rows[0].count, 10);
};

/**
 * Remove all participants from a cycle
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<void>}
 */
export const removeAllParticipants = async (cycleId) => {
  await query('DELETE FROM review_cycle_participants WHERE cycle_id = $1', [cycleId]);
};

export default {
  addParticipant,
  addMultipleParticipants,
  removeParticipant,
  getParticipants,
  isParticipant,
  getParticipant,
  updateManager,
  incrementAssignedPeersCount,
  decrementAssignedPeersCount,
  getParticipantCount,
  removeAllParticipants
};
