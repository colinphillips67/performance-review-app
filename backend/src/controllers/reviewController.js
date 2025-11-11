import * as Review from '../models/Review.js';
import * as ReviewCycle from '../models/ReviewCycle.js';
import * as User from '../models/User.js';

/**
 * Create or update a review (save as draft)
 * POST /api/reviews
 */
export const saveReview = async (req, res, next) => {
  try {
    const {
      reviewCycleId,
      revieweeId,
      reviewType,
      content
    } = req.body;

    const reviewerId = req.user.userId;

    // Validation
    if (!reviewCycleId || !revieweeId || !reviewType) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'reviewCycleId, revieweeId, and reviewType are required'
        }
      });
    }

    // Validate review type
    if (!['self', 'peer_360', 'manager'].includes(reviewType)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REVIEW_TYPE',
          message: 'reviewType must be self, peer_360, or manager'
        }
      });
    }

    // Validate content length
    if (content && content.length > 10000) {
      return res.status(400).json({
        error: {
          code: 'CONTENT_TOO_LONG',
          message: 'Review content cannot exceed 10,000 characters'
        }
      });
    }

    // Check if review cycle exists
    const cycle = await ReviewCycle.findById(reviewCycleId);
    if (!cycle) {
      return res.status(404).json({
        error: {
          code: 'CYCLE_NOT_FOUND',
          message: 'Review cycle not found'
        }
      });
    }

    // For self-evaluation, reviewer and reviewee must be the same
    if (reviewType === 'self' && reviewerId !== revieweeId) {
      return res.status(403).json({
        error: {
          code: 'INVALID_SELF_REVIEW',
          message: 'Self-evaluations can only be written for yourself'
        }
      });
    }

    // For manager review, verify the reviewer is the reviewee's manager
    if (reviewType === 'manager') {
      // TODO: Add org chart validation to ensure reviewer is reviewee's manager
      // For now, we'll allow it
    }

    // Check if review already exists
    const existingReview = await Review.findByCriteria(
      reviewCycleId,
      reviewerId,
      revieweeId,
      reviewType
    );

    let review;
    if (existingReview) {
      // Don't allow updating submitted reviews
      if (existingReview.status === 'submitted') {
        return res.status(400).json({
          error: {
            code: 'REVIEW_ALREADY_SUBMITTED',
            message: 'Cannot edit a submitted review. Contact administrator to revert to draft.'
          }
        });
      }

      // Update existing draft
      review = await Review.update(existingReview.review_id, { content });
    } else {
      // Create new review as draft
      review = await Review.create({
        reviewCycleId,
        reviewerId,
        revieweeId,
        reviewType,
        content: content || '',
        status: 'draft'
      });
    }

    res.status(200).json({
      success: true,
      review: {
        reviewId: review.review_id,
        reviewCycleId: review.review_cycle_id,
        reviewerId: review.reviewer_id,
        revieweeId: review.reviewee_id,
        reviewType: review.review_type,
        content: review.content,
        status: review.status,
        submittedAt: review.submitted_at,
        createdAt: review.created_at,
        updatedAt: review.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a review
 * POST /api/reviews/:id/submit
 */
export const submitReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Find the review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
        }
      });
    }

    // Verify the user is the reviewer
    if (review.reviewer_id !== userId) {
      return res.status(403).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only submit your own reviews'
        }
      });
    }

    // Check if already submitted
    if (review.status === 'submitted') {
      return res.status(400).json({
        error: {
          code: 'ALREADY_SUBMITTED',
          message: 'Review has already been submitted'
        }
      });
    }

    // Submit the review
    const updatedReview = await Review.submit(id);

    res.status(200).json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        reviewId: updatedReview.review_id,
        reviewType: updatedReview.review_type,
        status: updatedReview.status,
        submittedAt: updatedReview.submitted_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific review
 * GET /api/reviews/:id
 */
export const getReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
        }
      });
    }

    // Permission check: user must be reviewer, reviewee (with restrictions), or admin
    const canView =
      review.reviewer_id === userId || // Reviewer can always see their own review
      (review.review_type === 'self' && review.reviewee_id === userId) || // Employee can see their self-eval
      (review.review_type === 'manager' && review.reviewee_id === userId && review.is_released_to_employee) || // Employee can see released manager review
      req.user.isAdmin; // TODO: Add manager permission check

    if (!canView) {
      return res.status(403).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to view this review'
        }
      });
    }

    res.status(200).json({
      success: true,
      review: {
        reviewId: review.review_id,
        reviewCycleId: review.review_cycle_id,
        reviewerId: review.reviewer_id,
        revieweeId: review.reviewee_id,
        reviewType: review.review_type,
        content: review.content,
        status: review.status,
        submittedAt: review.submitted_at,
        isReleasedToEmployee: review.is_released_to_employee,
        releasedAt: review.released_at,
        createdAt: review.created_at,
        updatedAt: review.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reviews for current user (reviews they need to write)
 * GET /api/reviews/my-reviews
 */
export const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { cycleId } = req.query;

    const reviews = await Review.getReviewsByReviewer(userId, cycleId);

    const formattedReviews = reviews.map(review => ({
      reviewId: review.review_id,
      reviewCycleId: review.review_cycle_id,
      revieweeId: review.reviewee_id,
      revieweeName: `${review.reviewee_first_name} ${review.reviewee_last_name}`,
      revieweeJobTitle: review.reviewee_job_title,
      reviewType: review.review_type,
      content: review.content,
      status: review.status,
      submittedAt: review.submitted_at,
      createdAt: review.created_at,
      updatedAt: review.updated_at
    }));

    res.status(200).json({
      success: true,
      reviews: formattedReviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reviews for a specific employee (for managers)
 * GET /api/reviews/employee/:employeeId
 */
export const getEmployeeReviews = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { cycleId } = req.query;

    if (!cycleId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'cycleId is required'
        }
      });
    }

    // TODO: Add permission check - only managers and admins should access this

    const reviews = await Review.getReviewsForReviewee(cycleId, employeeId);

    const formattedReviews = reviews.map(review => ({
      reviewId: review.review_id,
      reviewType: review.review_type,
      reviewerId: review.reviewer_id,
      reviewerName: `${review.reviewer_first_name} ${review.reviewer_last_name}`,
      reviewerEmail: review.reviewer_email,
      content: review.content,
      status: review.status,
      submittedAt: review.submitted_at,
      isReleasedToEmployee: review.is_released_to_employee,
      releasedAt: review.released_at,
      createdAt: review.created_at
    }));

    res.status(200).json({
      success: true,
      reviews: formattedReviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Release manager review to employee (manager only)
 * POST /api/reviews/:id/release
 */
export const releaseReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
        }
      });
    }

    // Only manager reviews can be released
    if (review.review_type !== 'manager') {
      return res.status(400).json({
        error: {
          code: 'INVALID_OPERATION',
          message: 'Only manager reviews can be released to employees'
        }
      });
    }

    // Only the reviewer can release their review
    if (review.reviewer_id !== userId) {
      return res.status(403).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only release your own reviews'
        }
      });
    }

    // Must be submitted first
    if (review.status !== 'submitted') {
      return res.status(400).json({
        error: {
          code: 'NOT_SUBMITTED',
          message: 'Review must be submitted before it can be released'
        }
      });
    }

    // Release the review
    const updatedReview = await Review.releaseToEmployee(id);

    res.status(200).json({
      success: true,
      message: 'Review released to employee',
      review: {
        reviewId: updatedReview.review_id,
        isReleasedToEmployee: updatedReview.is_released_to_employee,
        releasedAt: updatedReview.released_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revert review to draft (admin only)
 * POST /api/reviews/:id/revert
 */
export const revertReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
        }
      });
    }

    if (review.status === 'draft') {
      return res.status(400).json({
        error: {
          code: 'ALREADY_DRAFT',
          message: 'Review is already in draft status'
        }
      });
    }

    const updatedReview = await Review.revertToDraft(id);

    res.status(200).json({
      success: true,
      message: 'Review reverted to draft',
      review: {
        reviewId: updatedReview.review_id,
        status: updatedReview.status
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  saveReview,
  submitReview,
  getReview,
  getMyReviews,
  getEmployeeReviews,
  releaseReview,
  revertReview
};
