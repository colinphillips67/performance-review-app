import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import * as orgChartController from '../controllers/orgChartController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Read routes (all authenticated users)
router.get('/', asyncHandler(orgChartController.getActiveOrgChart));
router.get('/tree', asyncHandler(orgChartController.getOrgChartTree));
router.get('/my-chain', asyncHandler(orgChartController.getMyReportingChain));
router.get('/:id', asyncHandler(orgChartController.getOrgChartById));

// Write routes (admin only)
router.post('/', requireAdmin, asyncHandler(orgChartController.createOrgChart));
router.put('/:id', requireAdmin, asyncHandler(orgChartController.updateOrgChart));
router.post('/relationships', requireAdmin, asyncHandler(orgChartController.addRelationship));
router.delete('/relationships/:id', requireAdmin, asyncHandler(orgChartController.removeRelationship));
router.get('/validate', requireAdmin, asyncHandler(orgChartController.validateOrgChart));

export default router;
