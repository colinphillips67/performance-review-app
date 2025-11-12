import { query } from '../config/database.js';

/**
 * ReviewCycle Model
 * Handles all database operations related to review cycles
 */

/**
 * Create a new review cycle
 * @param {Object} cycleData - Review cycle data
 * @param {string} cycleData.name - Cycle name
 * @param {string} [cycleData.description] - Cycle description
 * @param {Date} cycleData.startDate - Start date
 * @param {Date} cycleData.endDate - End date
 * @param {Date} cycleData.selfEvalDeadline - Self evaluation deadline
 * @param {Date} cycleData.peer360Deadline - Peer 360 review deadline
 * @param {Date} cycleData.managerEvalDeadline - Manager evaluation deadline
 * @param {number} cycleData.min360Reviewers - Minimum number of 360 reviewers
 * @param {number} cycleData.max360Reviewers - Maximum number of 360 reviewers
 * @param {string} cycleData.reviewerSelectionMethod - Reviewer selection method
 * @param {string} cycleData.createdBy - User ID who created the cycle
 * @param {string} [cycleData.status='planning'] - Cycle status
 * @param {string} cycleData.orgChartId - Organization chart ID to use
 * @returns {Promise<Object>} Created review cycle
 */
export const create = async (cycleData) => {
  const {
    name,
    description,
    startDate,
    endDate,
    selfEvalDeadline,
    peer360Deadline,
    managerEvalDeadline,
    min360Reviewers,
    max360Reviewers,
    reviewerSelectionMethod,
    createdBy,
    status = 'planning',
    orgChartId
  } = cycleData;

  const result = await query(
    `INSERT INTO review_cycles (
      name, description, start_date, end_date,
      self_eval_deadline, peer_360_deadline, manager_eval_deadline,
      min_360_reviewers, max_360_reviewers, reviewer_selection_method,
      created_by, status, org_chart_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING review_cycle_id, name, description, start_date, end_date,
              self_eval_deadline, peer_360_deadline, manager_eval_deadline,
              min_360_reviewers, max_360_reviewers, reviewer_selection_method,
              status, org_chart_id, created_by, created_at, updated_at`,
    [
      name,
      description,
      startDate,
      endDate,
      selfEvalDeadline,
      peer360Deadline,
      managerEvalDeadline,
      min360Reviewers,
      max360Reviewers,
      reviewerSelectionMethod,
      createdBy,
      status,
      orgChartId
    ]
  );

  return result.rows[0];
};

/**
 * Find review cycle by ID
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<Object|null>} Review cycle or null if not found
 */
export const findById = async (cycleId) => {
  const result = await query(
    `SELECT * FROM review_cycles WHERE review_cycle_id = $1`,
    [cycleId]
  );
  return result.rows[0] || null;
};

/**
 * Get all review cycles
 * @param {Object} [options] - Query options
 * @param {string} [options.status] - Filter by status
 * @returns {Promise<Array>} Array of review cycles
 */
export const getAll = async (options = {}) => {
  let queryText = `
    SELECT review_cycle_id, name, description, start_date, end_date, status, org_chart_id,
           created_at, updated_at
    FROM review_cycles
  `;
  const params = [];

  if (options.status) {
    queryText += ' WHERE status = $1';
    params.push(options.status);
  }

  queryText += ' ORDER BY start_date DESC';

  const result = await query(queryText, params);
  return result.rows;
};

/**
 * Get active review cycle
 * @returns {Promise<Object|null>} Active review cycle or null if none active
 */
export const getActive = async () => {
  const result = await query(
    `SELECT * FROM review_cycles
     WHERE status = 'active'
     ORDER BY start_date DESC
     LIMIT 1`
  );
  return result.rows[0] || null;
};

/**
 * Update review cycle
 * @param {string} cycleId - Cycle UUID
 * @param {Object} cycleData - Data to update
 * @param {string} [cycleData.name] - Cycle name
 * @param {string} [cycleData.description] - Cycle description
 * @param {Date} [cycleData.startDate] - Start date
 * @param {Date} [cycleData.endDate] - End date
 * @param {string} [cycleData.status] - Cycle status
 * @returns {Promise<Object>} Updated review cycle
 */
export const update = async (cycleId, cycleData) => {
  const { name, description, startDate, endDate, status } = cycleData;

  const result = await query(
    `UPDATE review_cycles
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         start_date = COALESCE($3, start_date),
         end_date = COALESCE($4, end_date),
         status = COALESCE($5, status)
     WHERE review_cycle_id = $6
     RETURNING review_cycle_id, name, description, start_date, end_date, status, org_chart_id,
               created_at, updated_at`,
    [name, description, startDate, endDate, status, cycleId]
  );

  return result.rows[0];
};

/**
 * Update review cycle status
 * @param {string} cycleId - Cycle UUID
 * @param {string} status - New status (planning, active, completed, cancelled)
 * @returns {Promise<Object>} Updated review cycle
 */
export const updateStatus = async (cycleId, status) => {
  const result = await query(
    `UPDATE review_cycles
     SET status = $1
     WHERE review_cycle_id = $2
     RETURNING review_cycle_id, name, description, start_date, end_date, status, org_chart_id,
               created_at, updated_at`,
    [status, cycleId]
  );

  return result.rows[0];
};

/**
 * Delete a review cycle
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<void>}
 */
export const deleteCycle = async (cycleId) => {
  await query('DELETE FROM review_cycles WHERE review_cycle_id = $1', [cycleId]);
};

/**
 * Get cycle with participant count
 * @param {string} cycleId - Cycle UUID
 * @returns {Promise<Object|null>} Cycle with participant statistics
 */
export const getCycleWithStats = async (cycleId) => {
  const result = await query(
    `SELECT
       rc.*,
       COUNT(DISTINCT rcp.employee_id) as participant_count,
       COUNT(DISTINCT CASE WHEN rcp.assigned_peers_count > 0 THEN rcp.employee_id END) as peers_assigned_count
     FROM review_cycles rc
     LEFT JOIN review_cycle_participants rcp ON rc.review_cycle_id = rcp.review_cycle_id
     WHERE rc.review_cycle_id = $1
     GROUP BY rc.review_cycle_id`,
    [cycleId]
  );

  return result.rows[0] || null;
};

/**
 * Get all cycles with participant counts
 * @returns {Promise<Array>} Array of cycles with statistics
 */
export const getAllWithStats = async () => {
  const result = await query(
    `SELECT
       rc.*,
       COUNT(DISTINCT rcp.employee_id) as participant_count,
       COUNT(DISTINCT CASE WHEN rcp.assigned_peers_count > 0 THEN rcp.employee_id END) as peers_assigned_count
     FROM review_cycles rc
     LEFT JOIN review_cycle_participants rcp ON rc.review_cycle_id = rcp.review_cycle_id
     GROUP BY rc.review_cycle_id
     ORDER BY rc.start_date DESC`
  );

  return result.rows;
};

export default {
  create,
  findById,
  getAll,
  getActive,
  update,
  updateStatus,
  deleteCycle,
  getCycleWithStats,
  getAllWithStats
};
