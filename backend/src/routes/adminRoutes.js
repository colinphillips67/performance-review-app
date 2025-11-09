import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', asyncHandler(adminController.getDashboard));
router.get('/overdue-reviews', asyncHandler(adminController.getOverdueReviews));
router.get('/upcoming-deadlines', asyncHandler(adminController.getUpcomingDeadlines));

// Actions
router.post('/send-reminder', asyncHandler(adminController.sendReminder));
router.post('/extend-deadline', asyncHandler(adminController.extendDeadline));

// Reports
router.get('/reports/completion', asyncHandler(adminController.getCompletionReport));

export default router;
