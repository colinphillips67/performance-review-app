import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get('/', requireAdmin, asyncHandler(userController.getAllUsers));
router.post('/', requireAdmin, asyncHandler(userController.createUser));
router.put('/:id', requireAdmin, asyncHandler(userController.updateUser));
router.delete('/:id', requireAdmin, asyncHandler(userController.deleteUser));
router.post('/:id/reset-password', requireAdmin, asyncHandler(userController.adminResetPassword));
router.get('/:id/login-history', requireAdmin, asyncHandler(userController.getLoginHistory));

// User can view their own profile
router.get('/:id', asyncHandler(userController.getUser));

export default router;
