import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import * as reviewCycleController from '../controllers/reviewCycleController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Read routes (all authenticated users can view cycles)
router.get('/active', asyncHandler(reviewCycleController.getActiveCycle));
router.get('/', asyncHandler(reviewCycleController.getAllCycles));

// Admin only routes
router.post('/', requireAdmin, asyncHandler(reviewCycleController.createCycle));
router.get('/:id', requireAdmin, asyncHandler(reviewCycleController.getCycleById));
router.put('/:id', requireAdmin, asyncHandler(reviewCycleController.updateCycle));
router.post('/:id/launch', requireAdmin, asyncHandler(reviewCycleController.launchCycle));
router.post('/:id/cancel', requireAdmin, asyncHandler(reviewCycleController.cancelCycle));
router.get('/:id/status', requireAdmin, asyncHandler(reviewCycleController.getCycleStatus));
router.get('/:id/participants', requireAdmin, asyncHandler(reviewCycleController.getParticipants));
router.post('/:id/participants', requireAdmin, asyncHandler(reviewCycleController.addParticipants));
router.delete('/:id/participants/:userId', requireAdmin, asyncHandler(reviewCycleController.removeParticipant));

// 360 reviewer selection
router.get('/:id/360-reviewers/:employeeId', asyncHandler(reviewCycleController.get360Reviewers));
router.post('/:id/360-reviewers/:employeeId', asyncHandler(reviewCycleController.assign360Reviewers));
router.get('/:id/eligible-360-reviewers/:employeeId', asyncHandler(reviewCycleController.getEligible360Reviewers));

export default router;
