import * as ReviewCycle from '../models/ReviewCycle.js';
import * as ReviewCycleParticipant from '../models/ReviewCycleParticipant.js';
import * as User from '../models/User.js';

/**
 * Review Cycle Controller
 * Handles HTTP requests for review cycle management
 */

/**
 * Get active review cycle
 * GET /api/review-cycles/active
 */
export const getActiveCycle = async (req, res, next) => {
  try {
    const cycle = await ReviewCycle.getActive();

    if (!cycle) {
      return res.status(404).json({
        error: {
          code: 'NO_ACTIVE_CYCLE',
          message: 'No active review cycle found'
        }
      });
    }

    res.json(cycle);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all review cycles (admin only)
 * GET /api/review-cycles
 */
export const getAllCycles = async (req, res, next) => {
  try {
    const { status } = req.query;
    const cycles = await ReviewCycle.getAllWithStats();

    // Filter by status if provided
    const filteredCycles = status
      ? cycles.filter(cycle => cycle.status === status)
      : cycles;

    // Convert snake_case to camelCase for frontend
    const formattedCycles = filteredCycles.map(cycle => ({
      cycleId: cycle.review_cycle_id,
      name: cycle.name,
      description: cycle.description,
      startDate: cycle.start_date,
      endDate: cycle.end_date,
      status: cycle.status,
      orgChartId: cycle.org_chart_id,
      participantCount: parseInt(cycle.participant_count, 10),
      peersAssignedCount: parseInt(cycle.peers_assigned_count, 10),
      createdAt: cycle.created_at,
      updatedAt: cycle.updated_at
    }));

    res.json(formattedCycles);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new review cycle (admin only)
 * POST /api/review-cycles
 */
export const createCycle = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, orgChartId } = req.body;

    // Validation
    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, start date, and end date are required'
        }
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format'
        }
      });
    }

    if (start >= end) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'End date must be after start date'
        }
      });
    }

    const cycle = await ReviewCycle.create({
      name,
      description,
      startDate: start,
      endDate: end,
      orgChartId: orgChartId || null
    });

    // Convert to camelCase
    res.status(201).json({
      cycleId: cycle.review_cycle_id,
      name: cycle.name,
      description: cycle.description,
      startDate: cycle.start_date,
      endDate: cycle.end_date,
      status: cycle.status,
      orgChartId: cycle.org_chart_id,
      createdAt: cycle.created_at,
      updatedAt: cycle.updated_at
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific review cycle
 * GET /api/review-cycles/:id
 */
export const getCycleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cycle = await ReviewCycle.getCycleWithStats(id);

    if (!cycle) {
      return res.status(404).json({
        error: {
          code: 'CYCLE_NOT_FOUND',
          message: 'Review cycle not found'
        }
      });
    }

    // Convert to camelCase
    res.json({
      cycleId: cycle.review_cycle_id,
      name: cycle.name,
      description: cycle.description,
      startDate: cycle.start_date,
      endDate: cycle.end_date,
      status: cycle.status,
      orgChartId: cycle.org_chart_id,
      participantCount: parseInt(cycle.participant_count, 10),
      peersAssignedCount: parseInt(cycle.peers_assigned_count, 10),
      createdAt: cycle.created_at,
      updatedAt: cycle.updated_at
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update review cycle (admin only)
 * PUT /api/review-cycles/:id
 */
export const updateCycle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate } = req.body;

    // Check if cycle exists
    const existingCycle = await ReviewCycle.findById(id);
    if (!existingCycle) {
      return res.status(404).json({
        error: {
          code: 'CYCLE_NOT_FOUND',
          message: 'Review cycle not found'
        }
      });
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return res.status(400).json({
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'End date must be after start date'
          }
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    const cycle = await ReviewCycle.update(id, updateData);

    // Convert to camelCase
    res.json({
      cycleId: cycle.review_cycle_id,
      name: cycle.name,
      description: cycle.description,
      startDate: cycle.start_date,
      endDate: cycle.end_date,
      status: cycle.status,
      orgChartId: cycle.org_chart_id,
      createdAt: cycle.created_at,
      updatedAt: cycle.updated_at
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Launch review cycle (change status to active)
 * POST /api/review-cycles/:id/launch
 */
export const launchCycle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cycle = await ReviewCycle.findById(id);
    if (!cycle) {
      return res.status(404).json({
        error: {
          code: 'CYCLE_NOT_FOUND',
          message: 'Review cycle not found'
        }
      });
    }

    if (cycle.status !== 'planning') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Only cycles in planning status can be launched'
        }
      });
    }

    // Check if there's already an active cycle
    const activeCycle = await ReviewCycle.getActive();
    if (activeCycle && activeCycle.cycle_id !== id) {
      return res.status(400).json({
        error: {
          code: 'ACTIVE_CYCLE_EXISTS',
          message: 'Another cycle is already active. Complete or cancel it first.'
        }
      });
    }

    const updatedCycle = await ReviewCycle.updateStatus(id, 'active');

    res.json({
      cycleId: updatedCycle.cycle_id,
      name: updatedCycle.name,
      description: updatedCycle.description,
      startDate: updatedCycle.start_date,
      endDate: updatedCycle.end_date,
      status: updatedCycle.status,
      orgChartId: updatedCycle.org_chart_id,
      createdAt: updatedCycle.created_at,
      updatedAt: updatedCycle.updated_at
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel review cycle
 * POST /api/review-cycles/:id/cancel
 */
export const cancelCycle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cycle = await ReviewCycle.findById(id);
    if (!cycle) {
      return res.status(404).json({
        error: {
          code: 'CYCLE_NOT_FOUND',
          message: 'Review cycle not found'
        }
      });
    }

    if (cycle.status === 'completed' || cycle.status === 'cancelled') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot cancel a ${cycle.status} cycle`
        }
      });
    }

    const updatedCycle = await ReviewCycle.updateStatus(id, 'cancelled');

    res.json({
      cycleId: updatedCycle.cycle_id,
      name: updatedCycle.name,
      description: updatedCycle.description,
      startDate: updatedCycle.start_date,
      endDate: updatedCycle.end_date,
      status: updatedCycle.status,
      orgChartId: updatedCycle.org_chart_id,
      createdAt: updatedCycle.created_at,
      updatedAt: updatedCycle.updated_at
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cycle status
 * GET /api/review-cycles/:id/status
 */
export const getCycleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cycle = await ReviewCycle.getCycleWithStats(id);
    if (!cycle) {
      return res.status(404).json({
        error: {
          code: 'CYCLE_NOT_FOUND',
          message: 'Review cycle not found'
        }
      });
    }

    res.json({
      cycleId: cycle.review_cycle_id,
      status: cycle.status,
      participantCount: parseInt(cycle.participant_count, 10),
      peersAssignedCount: parseInt(cycle.peers_assigned_count, 10)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get participants for a cycle
 * GET /api/review-cycles/:id/participants
 */
export const getParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if cycle exists
    const cycle = await ReviewCycle.findById(id);
    if (!cycle) {
      return res.status(404).json({
        error: {
          code: 'CYCLE_NOT_FOUND',
          message: 'Review cycle not found'
        }
      });
    }

    const participants = await ReviewCycleParticipant.getParticipants(id);

    // Convert to camelCase
    const formattedParticipants = participants.map(p => ({
      participantId: p.participant_id,
      cycleId: p.review_cycle_id,
      userId: p.user_id,
      managerId: p.manager_id,
      assignedPeersCount: p.assigned_peers_count,
      email: p.email,
      firstName: p.first_name,
      lastName: p.last_name,
      jobTitle: p.job_title,
      managerEmail: p.manager_email,
      managerFirstName: p.manager_first_name,
      managerLastName: p.manager_last_name,
      createdAt: p.created_at
    }));

    res.json(formattedParticipants);
  } catch (error) {
    next(error);
  }
};

/**
 * Add participants to cycle (admin only)
 * POST /api/review-cycles/:id/participants
 */
export const addParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    // Validation
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userIds must be a non-empty array'
        }
      });
    }

    // Check if cycle exists
    const cycle = await ReviewCycle.findById(id);
    if (!cycle) {
      return res.status(404).json({
        error: {
          code: 'CYCLE_NOT_FOUND',
          message: 'Review cycle not found'
        }
      });
    }

    // Verify all users exist
    const users = await Promise.all(userIds.map(userId => User.findById(userId)));
    const invalidUsers = userIds.filter((userId, index) => !users[index]);

    if (invalidUsers.length > 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_USERS',
          message: `Users not found: ${invalidUsers.join(', ')}`
        }
      });
    }

    // Check for duplicates
    const existingParticipants = await ReviewCycleParticipant.getParticipants(id);
    const existingUserIds = new Set(existingParticipants.map(p => p.user_id));
    const duplicates = userIds.filter(userId => existingUserIds.has(userId));

    if (duplicates.length > 0) {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_PARTICIPANTS',
          message: 'Some users are already participants in this cycle'
        }
      });
    }

    // Add participants
    const participantData = userIds.map(userId => ({ userId, managerId: null }));
    const participants = await ReviewCycleParticipant.addMultipleParticipants(id, participantData);

    res.status(201).json({
      message: `Added ${participants.length} participants`,
      count: participants.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove participant from cycle (admin only)
 * DELETE /api/review-cycles/:id/participants/:userId
 */
export const removeParticipant = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    // Check if cycle exists
    const cycle = await ReviewCycle.findById(id);
    if (!cycle) {
      return res.status(404).json({
        error: {
          code: 'CYCLE_NOT_FOUND',
          message: 'Review cycle not found'
        }
      });
    }

    // Check if user is a participant
    const isParticipant = await ReviewCycleParticipant.isParticipant(id, userId);
    if (!isParticipant) {
      return res.status(404).json({
        error: {
          code: 'PARTICIPANT_NOT_FOUND',
          message: 'User is not a participant in this cycle'
        }
      });
    }

    // Remove participant
    await ReviewCycleParticipant.removeParticipant(id, userId);

    res.status(200).json({
      message: 'Participant removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get 360 reviewers for an employee (stub)
 * GET /api/review-cycles/:id/360-reviewers/:employeeId
 */
export const get360Reviewers = async (req, res, next) => {
  // This will be implemented when we add the peer_360_assignments table logic
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: '360-degree reviewer management will be implemented in a future update'
    }
  });
};

/**
 * Assign 360 reviewers (stub)
 * POST /api/review-cycles/:id/360-reviewers/:employeeId
 */
export const assign360Reviewers = async (req, res, next) => {
  // This will be implemented when we add the peer_360_assignments table logic
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: '360-degree reviewer management will be implemented in a future update'
    }
  });
};

/**
 * Get eligible 360 reviewers (stub)
 * GET /api/review-cycles/:id/eligible-360-reviewers/:employeeId
 */
export const getEligible360Reviewers = async (req, res, next) => {
  // This will be implemented when we add the peer_360_assignments table logic
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: '360-degree reviewer management will be implemented in a future update'
    }
  });
};
