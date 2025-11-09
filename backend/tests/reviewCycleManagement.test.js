import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/config/database.js';
import * as authService from '../src/services/authService.js';

describe('Review Cycle Management API', () => {
  let adminToken;
  let regularUserToken;
  let adminUserId;
  let regularUserId;
  let testCycleId;
  let secondCycleId;
  let testUser1Id;
  let testUser2Id;

  beforeAll(async () => {
    // Cleanup any existing test users first
    await pool.query('DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM users WHERE email IN ($1, $2, $3, $4))', [
      'cycle-admin@example.com',
      'cycle-user@example.com',
      'participant1@example.com',
      'participant2@example.com'
    ]);
    await pool.query('DELETE FROM users WHERE email IN ($1, $2, $3, $4)', [
      'cycle-admin@example.com',
      'cycle-user@example.com',
      'participant1@example.com',
      'participant2@example.com'
    ]);

    // Create admin user
    const adminUser = await authService.register({
      email: 'cycle-admin@example.com',
      password: 'AdminPassword123!',
      firstName: 'Cycle',
      lastName: 'Admin',
      jobTitle: 'HR Manager',
      isAdmin: true
    });
    adminUserId = adminUser.user_id;

    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cycle-admin@example.com',
        password: 'AdminPassword123!'
      });
    adminToken = adminLoginResponse.body.token;

    // Create regular user
    const regularUser = await authService.register({
      email: 'cycle-user@example.com',
      password: 'UserPassword123!',
      firstName: 'Cycle',
      lastName: 'User',
      jobTitle: 'Engineer',
      isAdmin: false
    });
    regularUserId = regularUser.user_id;

    // Login as regular user
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cycle-user@example.com',
        password: 'UserPassword123!'
      });
    regularUserToken = userLoginResponse.body.token;

    // Create test users for participant tests
    const testUser1 = await authService.register({
      email: 'participant1@example.com',
      password: 'TestPass123!',
      firstName: 'Participant',
      lastName: 'One',
      jobTitle: 'Developer',
      isAdmin: false
    });
    testUser1Id = testUser1.user_id;

    const testUser2 = await authService.register({
      email: 'participant2@example.com',
      password: 'TestPass123!',
      firstName: 'Participant',
      lastName: 'Two',
      jobTitle: 'Designer',
      isAdmin: false
    });
    testUser2Id = testUser2.user_id;
  });

  afterAll(async () => {
    // Cleanup - delete in correct order due to foreign keys
    await pool.query('DELETE FROM review_cycle_participants WHERE cycle_id IN (SELECT cycle_id FROM review_cycles WHERE name LIKE $1)', ['%Test%']);
    await pool.query('DELETE FROM review_cycles WHERE name LIKE $1', ['%Test%']);
    await pool.query('DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM users WHERE email IN ($1, $2, $3, $4))', [
      'cycle-admin@example.com',
      'cycle-user@example.com',
      'participant1@example.com',
      'participant2@example.com'
    ]);
    await pool.query('DELETE FROM users WHERE email IN ($1, $2, $3, $4)', [
      'cycle-admin@example.com',
      'cycle-user@example.com',
      'participant1@example.com',
      'participant2@example.com'
    ]);
  });

  describe('POST /api/review-cycles', () => {
    it('should create a review cycle as admin', async () => {
      const cycleData = {
        name: 'Q1 2025 Test Cycle',
        description: 'Test performance review cycle',
        startDate: '2025-01-01',
        endDate: '2025-03-31'
      };

      const response = await request(app)
        .post('/api/review-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cycleData)
        .expect(201);

      expect(response.body).toHaveProperty('cycleId');
      expect(response.body).toHaveProperty('name', cycleData.name);
      expect(response.body).toHaveProperty('description', cycleData.description);
      expect(response.body).toHaveProperty('status', 'planning');
      expect(response.body.startDate).toContain('2025-01-01');
      expect(response.body.endDate).toContain('2025-03-31');

      testCycleId = response.body.cycleId;
    });

    it('should fail to create cycle without required fields', async () => {
      const response = await request(app)
        .post('/api/review-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Cycle'
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should fail to create cycle with invalid date range', async () => {
      const response = await request(app)
        .post('/api/review-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Dates Cycle',
          startDate: '2025-12-31',
          endDate: '2025-01-01'
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_DATE_RANGE');
    });

    it('should fail to create cycle as regular user', async () => {
      await request(app)
        .post('/api/review-cycles')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          name: 'Unauthorized Cycle',
          startDate: '2025-01-01',
          endDate: '2025-03-31'
        })
        .expect(403);
    });
  });

  describe('GET /api/review-cycles', () => {
    beforeAll(async () => {
      // Create another cycle for filtering tests
      const response = await request(app)
        .post('/api/review-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Q2 2025 Test Cycle',
          description: 'Second test cycle',
          startDate: '2025-04-01',
          endDate: '2025-06-30'
        });
      secondCycleId = response.body.cycleId;
    });

    it('should get all review cycles as admin', async () => {
      const response = await request(app)
        .get('/api/review-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      const cycle = response.body.find(c => c.cycleId === testCycleId);
      expect(cycle).toBeDefined();
      expect(cycle).toHaveProperty('name');
      expect(cycle).toHaveProperty('status');
      expect(cycle).toHaveProperty('participantCount');
      expect(cycle.participantCount).toBe(0);
    });

    it('should filter cycles by status', async () => {
      const response = await request(app)
        .get('/api/review-cycles?status=planning')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(cycle => {
        expect(cycle.status).toBe('planning');
      });
    });

    it('should allow regular users to view cycles', async () => {
      const response = await request(app)
        .get('/api/review-cycles')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/review-cycles/:id', () => {
    it('should get specific cycle by ID', async () => {
      const response = await request(app)
        .get(`/api/review-cycles/${testCycleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('cycleId', testCycleId);
      expect(response.body).toHaveProperty('name', 'Q1 2025 Test Cycle');
      expect(response.body).toHaveProperty('participantCount', 0);
    });

    it('should return 404 for non-existent cycle', async () => {
      const response = await request(app)
        .get('/api/review-cycles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toHaveProperty('code', 'CYCLE_NOT_FOUND');
    });
  });

  describe('PUT /api/review-cycles/:id', () => {
    it('should update cycle details as admin', async () => {
      const updates = {
        name: 'Q1 2025 Updated Cycle',
        description: 'Updated description',
        startDate: '2025-01-15',
        endDate: '2025-04-15'
      };

      const response = await request(app)
        .put(`/api/review-cycles/${testCycleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('name', updates.name);
      expect(response.body).toHaveProperty('description', updates.description);
    });

    it('should fail to update with invalid date range', async () => {
      const response = await request(app)
        .put(`/api/review-cycles/${testCycleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: '2025-12-31',
          endDate: '2025-01-01'
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_DATE_RANGE');
    });

    it('should fail to update as regular user', async () => {
      await request(app)
        .put(`/api/review-cycles/${testCycleId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);
    });
  });

  describe('POST /api/review-cycles/:id/participants', () => {
    it('should add participants to cycle', async () => {
      const response = await request(app)
        .post(`/api/review-cycles/${testCycleId}/participants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [testUser1Id, testUser2Id] })
        .expect(201);

      expect(response.body).toHaveProperty('count', 2);
      expect(response.body.message).toContain('Added 2 participants');
    });

    it('should fail to add duplicate participants', async () => {
      const response = await request(app)
        .post(`/api/review-cycles/${testCycleId}/participants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [testUser1Id] })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'DUPLICATE_PARTICIPANTS');
    });

    it('should fail with invalid user IDs', async () => {
      const response = await request(app)
        .post(`/api/review-cycles/${testCycleId}/participants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: ['00000000-0000-0000-0000-000000000000'] })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_USERS');
    });

    it('should fail with empty array', async () => {
      const response = await request(app)
        .post(`/api/review-cycles/${testCycleId}/participants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [] })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/review-cycles/:id/participants', () => {
    it('should get all participants for a cycle', async () => {
      const response = await request(app)
        .get(`/api/review-cycles/${testCycleId}/participants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      const participant = response.body[0];
      expect(participant).toHaveProperty('participantId');
      expect(participant).toHaveProperty('userId');
      expect(participant).toHaveProperty('firstName');
      expect(participant).toHaveProperty('lastName');
      expect(participant).toHaveProperty('email');
      expect(participant).toHaveProperty('jobTitle');
    });

    it('should return empty array for cycle with no participants', async () => {
      const response = await request(app)
        .get(`/api/review-cycles/${secondCycleId}/participants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('POST /api/review-cycles/:id/launch', () => {
    it('should launch a cycle (planning -> active)', async () => {
      const response = await request(app)
        .post(`/api/review-cycles/${testCycleId}/launch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should fail to launch already active cycle', async () => {
      const response = await request(app)
        .post(`/api/review-cycles/${testCycleId}/launch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_STATUS');
    });

    it('should fail to launch second cycle when one is active', async () => {
      const response = await request(app)
        .post(`/api/review-cycles/${secondCycleId}/launch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'ACTIVE_CYCLE_EXISTS');
    });

    it('should fail to launch as regular user', async () => {
      await request(app)
        .post(`/api/review-cycles/${secondCycleId}/launch`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('GET /api/review-cycles/active', () => {
    it('should get the active review cycle', async () => {
      const response = await request(app)
        .get('/api/review-cycles/active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('cycle_id', testCycleId);
      expect(response.body).toHaveProperty('status', 'active');
    });
  });

  describe('GET /api/review-cycles/:id/status', () => {
    it('should get cycle status with participant counts', async () => {
      const response = await request(app)
        .get(`/api/review-cycles/${testCycleId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('cycleId', testCycleId);
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('participantCount', 2);
      expect(response.body).toHaveProperty('peersAssignedCount', 0);
    });
  });

  describe('POST /api/review-cycles/:id/cancel', () => {
    it('should cancel an active cycle', async () => {
      const response = await request(app)
        .post(`/api/review-cycles/${testCycleId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'cancelled');
    });

    it('should fail to cancel already cancelled cycle', async () => {
      const response = await request(app)
        .post(`/api/review-cycles/${testCycleId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_STATUS');
    });

    it('should fail to cancel as regular user', async () => {
      await request(app)
        .post(`/api/review-cycles/${secondCycleId}/cancel`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('Authorization Tests', () => {
    it('should fail all admin operations without auth token', async () => {
      await request(app).get('/api/review-cycles').expect(401);
      await request(app).post('/api/review-cycles').send({}).expect(401);
      await request(app).put(`/api/review-cycles/${testCycleId}`).send({}).expect(401);
      await request(app).post(`/api/review-cycles/${testCycleId}/launch`).expect(401);
      await request(app).post(`/api/review-cycles/${testCycleId}/cancel`).expect(401);
    });
  });
});
