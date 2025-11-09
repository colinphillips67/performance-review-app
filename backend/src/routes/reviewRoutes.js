import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import * as reviewController from '../controllers/reviewController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Employee routes
router.get('/my-reviews', asyncHandler(reviewController.getMyReviews));
router.get('/pending', asyncHandler(reviewController.getPendingReviews));
router.get('/:id', asyncHandler(reviewController.getReviewById));
router.post('/', asyncHandler(reviewController.createReview));
router.put('/:id', asyncHandler(reviewController.updateReview));
router.post('/:id/submit', asyncHandler(reviewController.submitReview));
router.get('/:id/export-pdf', asyncHandler(reviewController.exportPDF));

// Manager routes
router.post('/:id/release', asyncHandler(reviewController.releaseReview));

// Admin routes
router.post('/:id/revert', requireAdmin, asyncHandler(reviewController.revertReview));

export default router;
