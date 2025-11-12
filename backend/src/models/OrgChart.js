import { query } from '../config/database.js';

/**
 * OrgChart Model
 * Handles all database operations related to organizational charts
 */

/**
 * Create a new organization chart
 * @param {Object} chartData - Org chart data
 * @param {number} chartData.version - Chart version number
 * @param {string} [chartData.rootEmployeeId] - Root employee UUID
 * @returns {Promise<Object>} Created org chart
 */
export const create = async (chartData) => {
  const { version, rootEmployeeId = null } = chartData;

  const result = await query(
    `INSERT INTO org_charts (version, root_employee_id)
     VALUES ($1, $2)
     RETURNING org_chart_id, version, root_employee_id, created_at, is_active`,
    [version, rootEmployeeId]
  );

  return result.rows[0];
};

/**
 * Find org chart by ID
 * @param {string} orgChartId - Org chart UUID
 * @returns {Promise<Object|null>} Org chart or null if not found
 */
export const findById = async (orgChartId) => {
  const result = await query(
    `SELECT * FROM org_charts WHERE org_chart_id = $1`,
    [orgChartId]
  );
  return result.rows[0] || null;
};

/**
 * Get active org chart
 * @returns {Promise<Object|null>} Active org chart or null if none active
 */
export const getActive = async () => {
  const result = await query(
    `SELECT * FROM org_charts
     WHERE is_active = true
     ORDER BY created_at DESC
     LIMIT 1`
  );
  return result.rows[0] || null;
};

/**
 * Deactivate an org chart
 * @param {string} orgChartId - Org chart UUID
 * @returns {Promise<Object>} Updated org chart
 */
export const deactivate = async (orgChartId) => {
  const result = await query(
    `UPDATE org_charts
     SET is_active = false
     WHERE org_chart_id = $1
     RETURNING *`,
    [orgChartId]
  );
  return result.rows[0];
};

/**
 * Delete an org chart
 * @param {string} orgChartId - Org chart UUID
 * @returns {Promise<void>}
 */
export const deleteChart = async (orgChartId) => {
  await query('DELETE FROM org_charts WHERE org_chart_id = $1', [orgChartId]);
};

export default {
  create,
  findById,
  getActive,
  deactivate,
  deleteChart
};
