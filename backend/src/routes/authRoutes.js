import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/login', asyncHandler(authController.login));
router.post('/logout', authenticateToken, asyncHandler(authController.logout));
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', authenticateToken, asyncHandler(authController.resetPassword));

// 2FA routes
router.post('/setup-2fa', authenticateToken, asyncHandler(authController.setup2FA));
router.post('/verify-2fa', asyncHandler(authController.verify2FA));
router.post('/disable-2fa', authenticateToken, asyncHandler(authController.disable2FA));

// Session validation
router.get('/session', authenticateToken, asyncHandler(authController.validateSession));

export default router;
