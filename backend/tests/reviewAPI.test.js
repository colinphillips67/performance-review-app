import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/config/database.js';
import * as User from '../src/models/User.js';
import * as OrgChart from '../src/models/OrgChart.js';
import * as authService from '../src/services/authService.js';

describe('Review API', () => {
  let employee, manager, peer, admin;
  let employeeToken, managerToken, peerToken, adminToken;
  let testOrgChart, testCycle;
  let selfReviewId, peer360ReviewId, managerReviewId;

  beforeAll(async () => {
    // Create test users
    const passwordHash = await authService.hashPassword('TestPassword1!');

    employee = await User.create({
      email: 'review-api-employee@example.com',
      firstName: 'ReviewAPI',
      lastName: 'Employee',
      jobTitle: 'Software Engineer',
      passwordHash,
      isAdmin: false
    });

    manager = await User.create({
      email: 'review-api-manager@example.com',
      firstName: 'ReviewAPI',
      lastName: 'Manager',
      jobTitle: 'Engineering Manager',
      passwordHash,
      isAdmin: false
    });

    peer = await User.create({
      email: 'review-api-peer@example.com',
      firstName: 'ReviewAPI',
      lastName: 'Peer',
      jobTitle: 'Software Engineer',
      passwordHash,
      isAdmin: false
    });

    admin = await User.create({
      email: 'review-api-admin@example.com',
      firstName: 'ReviewAPI',
      lastName: 'Admin',
      jobTitle: 'Administrator',
      passwordHash,
      isAdmin: true
    });

    // Get auth tokens
    const employeeLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'review-api-employee@example.com',
        password: 'TestPassword1!'
      });
    employeeToken = employeeLogin.body.token;

    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'review-api-manager@example.com',
        password: 'TestPassword1!'
      });
    managerToken = managerLogin.body.token;

    const peerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'review-api-peer@example.com',
        password: 'TestPassword1!'
      });
    peerToken = peerLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'review-api-admin@example.com',
        password: 'TestPassword1!'
      });
    adminToken = adminLogin.body.token;

    // Create org chart
    testOrgChart = await OrgChart.create({
      version: 1,
      rootEmployeeId: manager.user_id
    });

    // Create review cycle
    const startDate = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const selfEvalDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const peer360Deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const managerEvalDeadline = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO review_cycles (
        name, org_chart_id, start_date, end_date,
        self_eval_deadline, peer_360_deadline, manager_eval_deadline,
        min_360_reviewers, max_360_reviewers, reviewer_selection_method,
        status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        'Review API Test Cycle',
        testOrgChart.org_chart_id,
        startDate,
        endDate,
        selfEvalDeadline,
        peer360Deadline,
        managerEvalDeadline,
        0,
        5,
        'manager_selects',
        'active',
        manager.user_id
      ]
    );
    testCycle = result.rows[0];
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM reviews WHERE reviewer_id IN (SELECT user_id FROM users WHERE email LIKE $1)', ['review-api-%']);
    await pool.query('DELETE FROM review_cycle_participants WHERE review_cycle_id = $1', [testCycle.review_cycle_id]);
    await pool.query('DELETE FROM review_cycles WHERE review_cycle_id = $1', [testCycle.review_cycle_id]);
    await pool.query('DELETE FROM org_charts WHERE org_chart_id = $1', [testOrgChart.org_chart_id]);
    await pool.query('DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE $1)', ['review-api-%']);
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['review-api-%']);
  });

  describe('POST /api/reviews - Save Review', () => {
    it('should create a new self-evaluation review', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          reviewCycleId: testCycle.review_cycle_id,
          revieweeId: employee.user_id,
          reviewType: 'self',
          content: 'This is my self-evaluation.'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.review).toBeDefined();
      expect(response.body.review.reviewId).toBeDefined();
      expect(response.body.review.reviewType).toBe('self');
      expect(response.body.review.content).toBe('This is my self-evaluation.');
      expect(response.body.review.status).toBe('draft');

      selfReviewId = response.body.review.reviewId;
    });

    it('should update existing draft review', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          reviewCycleId: testCycle.review_cycle_id,
          revieweeId: employee.user_id,
          reviewType: 'self',
          content: 'Updated self-evaluation content.'
        })
        .expect(200);

      expect(response.body.review.content).toBe('Updated self-evaluation content.');
      expect(response.body.review.reviewId).toBe(selfReviewId);
    });

    it('should create a 360 peer review', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${peerToken}`)
        .send({
          reviewCycleId: testCycle.review_cycle_id,
          revieweeId: employee.user_id,
          reviewType: 'peer_360',
          content: 'This is a 360 review for the employee.'
        })
        .expect(200);

      expect(response.body.review.reviewType).toBe('peer_360');
      peer360ReviewId = response.body.review.reviewId;
    });

    it('should create a manager review', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          reviewCycleId: testCycle.review_cycle_id,
          revieweeId: employee.user_id,
          reviewType: 'manager',
          content: 'This is a manager review.'
        })
        .expect(200);

      expect(response.body.review.reviewType).toBe('manager');
      managerReviewId = response.body.review.reviewId;
    });

    it('should reject self-evaluation where reviewer != reviewee', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          reviewCycleId: testCycle.review_cycle_id,
          revieweeId: peer.user_id, // Different from employee
          reviewType: 'self',
          content: 'Invalid self-eval.'
        })
        .expect(403);

      expect(response.body.error.code).toBe('INVALID_SELF_REVIEW');
    });

    it('should reject content exceeding 10,000 characters', async () => {
      const longContent = 'a'.repeat(10001);

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          reviewCycleId: testCycle.review_cycle_id,
          revieweeId: employee.user_id,
          reviewType: 'self',
          content: longContent
        })
        .expect(400);

      expect(response.body.error.code).toBe('CONTENT_TOO_LONG');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/reviews')
        .send({
          reviewCycleId: testCycle.review_cycle_id,
          revieweeId: employee.user_id,
          reviewType: 'self',
          content: 'Test'
        })
        .expect(401);
    });
  });

  describe('POST /api/reviews/:id/submit - Submit Review', () => {
    it('should submit a draft review', async () => {
      const response = await request(app)
        .post(`/api/reviews/${selfReviewId}/submit`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.review.status).toBe('submitted');
      expect(response.body.review.submittedAt).toBeDefined();
    });

    it('should reject submitting already submitted review', async () => {
      const response = await request(app)
        .post(`/api/reviews/${selfReviewId}/submit`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('ALREADY_SUBMITTED');
    });

    it('should reject submitting another user\'s review', async () => {
      const response = await request(app)
        .post(`/api/reviews/${peer360ReviewId}/submit`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent review', async () => {
      await request(app)
        .post('/api/reviews/00000000-0000-0000-0000-000000000000/submit')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);
    });
  });

  describe('GET /api/reviews/:id - Get Review', () => {
    it('should allow reviewer to view their own review', async () => {
      const response = await request(app)
        .get(`/api/reviews/${selfReviewId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.review).toBeDefined();
      expect(response.body.review.reviewId).toBe(selfReviewId);
    });

    it('should allow employee to view their self-evaluation', async () => {
      const response = await request(app)
        .get(`/api/reviews/${selfReviewId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.review.reviewType).toBe('self');
    });

    it('should prevent unauthorized access to reviews', async () => {
      // Try to access employee's self review as peer (who is not involved)
      await request(app)
        .get(`/api/reviews/${selfReviewId}`)
        .set('Authorization', `Bearer ${peerToken}`)
        .expect(403); // Peer is not reviewer or reviewee of this self-review
    });
  });

  describe('GET /api/reviews/my-reviews - Get My Reviews', () => {
    it('should return all reviews for current user', async () => {
      const response = await request(app)
        .get('/api/reviews/my-reviews')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reviews).toBeDefined();
      expect(Array.isArray(response.body.reviews)).toBe(true);
    });

    it('should filter reviews by cycle', async () => {
      const response = await request(app)
        .get(`/api/reviews/my-reviews?cycleId=${testCycle.review_cycle_id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.reviews).toBeDefined();
      response.body.reviews.forEach(review => {
        expect(review.reviewCycleId).toBe(testCycle.review_cycle_id);
      });
    });
  });

  describe('GET /api/reviews/employee/:employeeId - Get Employee Reviews', () => {
    it('should return all reviews for an employee', async () => {
      const response = await request(app)
        .get(`/api/reviews/employee/${employee.user_id}?cycleId=${testCycle.review_cycle_id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reviews).toBeDefined();
      expect(Array.isArray(response.body.reviews)).toBe(true);
    });

    it('should require cycleId parameter', async () => {
      const response = await request(app)
        .get(`/api/reviews/employee/${employee.user_id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/reviews/:id/release - Release Manager Review', () => {
    it('should release manager review to employee', async () => {
      // First submit the manager review
      await request(app)
        .post(`/api/reviews/${managerReviewId}/submit`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // Then release it
      const response = await request(app)
        .post(`/api/reviews/${managerReviewId}/release`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.review.isReleasedToEmployee).toBe(true);
      expect(response.body.review.releasedAt).toBeDefined();
    });

    it('should reject releasing non-manager review', async () => {
      const response = await request(app)
        .post(`/api/reviews/${selfReviewId}/release`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_OPERATION');
    });

    it('should reject releasing another manager\'s review', async () => {
      const response = await request(app)
        .post(`/api/reviews/${managerReviewId}/release`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/reviews/:id/revert - Revert Review (Admin)', () => {
    it('should allow admin to revert submitted review to draft', async () => {
      const response = await request(app)
        .post(`/api/reviews/${selfReviewId}/revert`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.review.status).toBe('draft');
    });

    it('should reject revert from non-admin', async () => {
      await request(app)
        .post(`/api/reviews/${selfReviewId}/revert`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });

    it('should reject reverting already draft review', async () => {
      const response = await request(app)
        .post(`/api/reviews/${selfReviewId}/revert`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('ALREADY_DRAFT');
    });
  });
});
