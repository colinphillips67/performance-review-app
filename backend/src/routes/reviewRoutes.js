import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import * as reviewController from '../controllers/reviewController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Employee routes
router.get('/my-reviews', asyncHandler(reviewController.getMyReviews));
router.get('/employee/:employeeId', asyncHandler(reviewController.getEmployeeReviews));
router.get('/:id', asyncHandler(reviewController.getReview));
router.post('/', asyncHandler(reviewController.saveReview));
router.post('/:id/submit', asyncHandler(reviewController.submitReview));

// Manager routes
router.post('/:id/release', asyncHandler(reviewController.releaseReview));

// Admin routes
router.post('/:id/revert', requireAdmin, asyncHandler(reviewController.revertReview));

export default router;
