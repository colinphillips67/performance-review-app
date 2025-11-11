import { query } from '../config/database.js';

/**
 * Review Model
 * Handles all database operations related to reviews (self, 360, manager)
 */

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @param {string} reviewData.reviewCycleId - Review cycle UUID
 * @param {string} reviewData.reviewerId - Reviewer's UUID
 * @param {string} reviewData.revieweeId - Reviewee's UUID
 * @param {string} reviewData.reviewType - Type: 'self', 'peer_360', or 'manager'
 * @param {string} [reviewData.content] - Review content (max 10,000 chars)
 * @param {string} [reviewData.status='draft'] - Status: 'draft' or 'submitted'
 * @returns {Promise<Object>} Created review record
 */
export const create = async (reviewData) => {
  const {
    reviewCycleId,
    reviewerId,
    revieweeId,
    reviewType,
    content = '',
    status = 'draft'
  } = reviewData;

  const result = await query(
    `INSERT INTO reviews (
      review_cycle_id, reviewer_id, reviewee_id, review_type, content, status
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [reviewCycleId, reviewerId, revieweeId, reviewType, content, status]
  );

  return result.rows[0];
};

/**
 * Find review by ID
 * @param {string} reviewId - Review UUID
 * @returns {Promise<Object|null>} Review record or null
 */
export const findById = async (reviewId) => {
  const result = await query(
    'SELECT * FROM reviews WHERE review_id = $1',
    [reviewId]
  );

  return result.rows[0] || null;
};

/**
 * Find existing review by cycle, reviewer, reviewee, and type
 * @param {string} reviewCycleId - Review cycle UUID
 * @param {string} reviewerId - Reviewer UUID
 * @param {string} revieweeId - Reviewee UUID
 * @param {string} reviewType - Type: 'self', 'peer_360', or 'manager'
 * @returns {Promise<Object|null>} Review record or null
 */
export const findByCriteria = async (reviewCycleId, reviewerId, revieweeId, reviewType) => {
  const result = await query(
    `SELECT * FROM reviews
     WHERE review_cycle_id = $1
       AND reviewer_id = $2
       AND reviewee_id = $3
       AND review_type = $4`,
    [reviewCycleId, reviewerId, revieweeId, reviewType]
  );

  return result.rows[0] || null;
};

/**
 * Update review content and/or status
 * @param {string} reviewId - Review UUID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.content] - Review content
 * @param {string} [updates.status] - Review status
 * @returns {Promise<Object>} Updated review record
 */
export const update = async (reviewId, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.content !== undefined) {
    fields.push(`content = $${paramCount++}`);
    values.push(updates.content);
  }

  if (updates.status !== undefined) {
    fields.push(`status = $${paramCount++}`);
    values.push(updates.status);

    // If submitting, set submitted_at
    if (updates.status === 'submitted') {
      fields.push(`submitted_at = NOW() AT TIME ZONE 'UTC'`);
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(reviewId);

  const result = await query(
    `UPDATE reviews
     SET ${fields.join(', ')}
     WHERE review_id = $${paramCount}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Submit a review (change status from draft to submitted)
 * @param {string} reviewId - Review UUID
 * @returns {Promise<Object>} Updated review record
 */
export const submit = async (reviewId) => {
  const result = await query(
    `UPDATE reviews
     SET status = 'submitted',
         submitted_at = NOW() AT TIME ZONE 'UTC'
     WHERE review_id = $1
     RETURNING *`,
    [reviewId]
  );

  return result.rows[0];
};

/**
 * Revert review back to draft (admin only)
 * @param {string} reviewId - Review UUID
 * @returns {Promise<Object>} Updated review record
 */
export const revertToDraft = async (reviewId) => {
  const result = await query(
    `UPDATE reviews
     SET status = 'draft',
         submitted_at = NULL
     WHERE review_id = $1
     RETURNING *`,
    [reviewId]
  );

  return result.rows[0];
};

/**
 * Release manager review to employee
 * @param {string} reviewId - Review UUID
 * @returns {Promise<Object>} Updated review record
 */
export const releaseToEmployee = async (reviewId) => {
  const result = await query(
    `UPDATE reviews
     SET is_released_to_employee = TRUE,
         released_at = NOW() AT TIME ZONE 'UTC'
     WHERE review_id = $1 AND review_type = 'manager'
     RETURNING *`,
    [reviewId]
  );

  return result.rows[0];
};

/**
 * Get all reviews for a reviewee in a specific cycle
 * @param {string} reviewCycleId - Review cycle UUID
 * @param {string} revieweeId - Reviewee UUID
 * @returns {Promise<Array>} Array of review records with reviewer details
 */
export const getReviewsForReviewee = async (reviewCycleId, revieweeId) => {
  const result = await query(
    `SELECT
      r.*,
      u.first_name as reviewer_first_name,
      u.last_name as reviewer_last_name,
      u.email as reviewer_email
     FROM reviews r
     JOIN users u ON r.reviewer_id = u.user_id
     WHERE r.review_cycle_id = $1 AND r.reviewee_id = $2
     ORDER BY r.review_type, r.created_at`,
    [reviewCycleId, revieweeId]
  );

  return result.rows;
};

/**
 * Get all reviews written by a specific reviewer
 * @param {string} reviewerId - Reviewer UUID
 * @param {string} [reviewCycleId] - Optional: filter by review cycle
 * @returns {Promise<Array>} Array of review records with reviewee details
 */
export const getReviewsByReviewer = async (reviewerId, reviewCycleId = null) => {
  const params = [reviewerId];
  let whereClause = 'WHERE r.reviewer_id = $1';

  if (reviewCycleId) {
    params.push(reviewCycleId);
    whereClause += ` AND r.review_cycle_id = $2`;
  }

  const result = await query(
    `SELECT
      r.*,
      u.first_name as reviewee_first_name,
      u.last_name as reviewee_last_name,
      u.email as reviewee_email,
      u.job_title as reviewee_job_title
     FROM reviews r
     JOIN users u ON r.reviewee_id = u.user_id
     ${whereClause}
     ORDER BY r.created_at DESC`,
    params
  );

  return result.rows;
};

/**
 * Get 360 reviews for a specific reviewee in a cycle
 * @param {string} reviewCycleId - Review cycle UUID
 * @param {string} revieweeId - Reviewee UUID
 * @returns {Promise<Array>} Array of 360 review records
 */
export const get360Reviews = async (reviewCycleId, revieweeId) => {
  const result = await query(
    `SELECT
      r.*,
      u.first_name as reviewer_first_name,
      u.last_name as reviewer_last_name,
      u.email as reviewer_email,
      u.job_title as reviewer_job_title
     FROM reviews r
     JOIN users u ON r.reviewer_id = u.user_id
     WHERE r.review_cycle_id = $1
       AND r.reviewee_id = $2
       AND r.review_type = 'peer_360'
     ORDER BY r.submitted_at DESC NULLS LAST, r.created_at`,
    [reviewCycleId, revieweeId]
  );

  return result.rows;
};

/**
 * Delete a review
 * @param {string} reviewId - Review UUID
 * @returns {Promise<void>}
 */
export const deleteReview = async (reviewId) => {
  await query('DELETE FROM reviews WHERE review_id = $1', [reviewId]);
};

/**
 * Get review counts by type and status for a cycle
 * @param {string} reviewCycleId - Review cycle UUID
 * @returns {Promise<Object>} Statistics object
 */
export const getReviewStats = async (reviewCycleId) => {
  const result = await query(
    `SELECT
      review_type,
      status,
      COUNT(*) as count
     FROM reviews
     WHERE review_cycle_id = $1
     GROUP BY review_type, status`,
    [reviewCycleId]
  );

  return result.rows;
};

export default {
  create,
  findById,
  findByCriteria,
  update,
  submit,
  revertToDraft,
  releaseToEmployee,
  getReviewsForReviewee,
  getReviewsByReviewer,
  get360Reviews,
  deleteReview,
  getReviewStats
};
