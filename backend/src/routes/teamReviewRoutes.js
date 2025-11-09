import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import * as teamReviewController from '../controllers/teamReviewController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Manager routes
router.get('/', asyncHandler(teamReviewController.getAllSubordinates));
router.get('/direct-reports', asyncHandler(teamReviewController.getDirectReports));
router.get('/:employeeId', asyncHandler(teamReviewController.getEmployeeReviews));
router.get('/:employeeId/cycle/:cycleId', asyncHandler(teamReviewController.getEmployeeReviewForCycle));

export default router;
