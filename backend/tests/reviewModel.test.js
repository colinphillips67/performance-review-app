import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as Review from '../src/models/Review.js';
import * as User from '../src/models/User.js';
import * as OrgChart from '../src/models/OrgChart.js';
import * as authService from '../src/services/authService.js';
import { pool } from '../src/config/database.js';

describe('Review Model', () => {
  let testUser1, testUser2, testUser3;
  let testOrgChart;
  let testCycle;
  let testReview;

  beforeAll(async () => {
    // Create test users
    const passwordHash = await authService.hashPassword('TestPassword1!');

    testUser1 = await User.create({
      email: 'review-test1@example.com',
      firstName: 'Review',
      lastName: 'Test1',
      jobTitle: 'Employee',
      passwordHash,
      isAdmin: false
    });

    testUser2 = await User.create({
      email: 'review-test2@example.com',
      firstName: 'Review',
      lastName: 'Test2',
      jobTitle: 'Manager',
      passwordHash,
      isAdmin: false
    });

    testUser3 = await User.create({
      email: 'review-test3@example.com',
      firstName: 'Review',
      lastName: 'Test3',
      jobTitle: 'Peer',
      passwordHash,
      isAdmin: false
    });

    // Create org chart
    testOrgChart = await OrgChart.create({
      version: 1,
      rootEmployeeId: testUser2.user_id
    });

    // Create review cycle directly with SQL to match actual schema
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
        'Review Model Test Cycle',
        testOrgChart.org_chart_id,
        startDate,
        endDate,
        selfEvalDeadline,
        peer360Deadline,
        managerEvalDeadline,
        0, // min_360_reviewers
        5, // max_360_reviewers
        'manager_selects',
        'active',
        testUser2.user_id
      ]
    );
    testCycle = result.rows[0];
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM reviews WHERE reviewer_id IN (SELECT user_id FROM users WHERE email LIKE $1)', ['review-test%']);
    await pool.query('DELETE FROM review_cycle_participants WHERE review_cycle_id = $1', [testCycle.review_cycle_id]);
    await pool.query('DELETE FROM review_cycles WHERE review_cycle_id = $1', [testCycle.review_cycle_id]);
    await pool.query('DELETE FROM org_charts WHERE org_chart_id = $1', [testOrgChart.org_chart_id]);
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['review-test%']);
  });

  describe('create', () => {
    it('should create a self-evaluation review', async () => {
      const review = await Review.create({
        reviewCycleId: testCycle.review_cycle_id,
        reviewerId: testUser1.user_id,
        revieweeId: testUser1.user_id,
        reviewType: 'self',
        content: 'This is my self-evaluation.',
        status: 'draft'
      });

      expect(review).toBeDefined();
      expect(review.review_id).toBeDefined();
      expect(review.reviewer_id).toBe(testUser1.user_id);
      expect(review.reviewee_id).toBe(testUser1.user_id);
      expect(review.review_type).toBe('self');
      expect(review.content).toBe('This is my self-evaluation.');
      expect(review.status).toBe('draft');

      testReview = review;
    });

    it('should create a 360 peer review', async () => {
      const review = await Review.create({
        reviewCycleId: testCycle.review_cycle_id,
        reviewerId: testUser3.user_id,
        revieweeId: testUser1.user_id,
        reviewType: 'peer_360',
        content: 'This is a 360 review.',
        status: 'draft'
      });

      expect(review).toBeDefined();
      expect(review.review_type).toBe('peer_360');
      expect(review.reviewer_id).toBe(testUser3.user_id);
      expect(review.reviewee_id).toBe(testUser1.user_id);
    });

    it('should create a manager review', async () => {
      const review = await Review.create({
        reviewCycleId: testCycle.review_cycle_id,
        reviewerId: testUser2.user_id,
        revieweeId: testUser1.user_id,
        reviewType: 'manager',
        content: 'This is a manager review.',
        status: 'draft'
      });

      expect(review).toBeDefined();
      expect(review.review_type).toBe('manager');
      expect(review.reviewer_id).toBe(testUser2.user_id);
    });

    it('should enforce 10,000 character limit', async () => {
      const longContent = 'a'.repeat(10001);

      await expect(async () => {
        await Review.create({
          reviewCycleId: testCycle.review_cycle_id,
          reviewerId: testUser1.user_id,
          revieweeId: testUser1.user_id,
          reviewType: 'self',
          content: longContent,
          status: 'draft'
        });
      }).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find review by ID', async () => {
      const review = await Review.findById(testReview.review_id);

      expect(review).toBeDefined();
      expect(review.review_id).toBe(testReview.review_id);
      expect(review.content).toBe('This is my self-evaluation.');
    });

    it('should return null for non-existent review', async () => {
      const review = await Review.findById('00000000-0000-0000-0000-000000000000');
      expect(review).toBeNull();
    });
  });

  describe('findByCriteria', () => {
    it('should find existing review by criteria', async () => {
      const review = await Review.findByCriteria(
        testCycle.review_cycle_id,
        testUser1.user_id,
        testUser1.user_id,
        'self'
      );

      expect(review).toBeDefined();
      expect(review.review_id).toBe(testReview.review_id);
    });

    it('should return null when no match found', async () => {
      const review = await Review.findByCriteria(
        testCycle.review_cycle_id,
        testUser1.user_id,
        testUser2.user_id,
        'self'
      );

      expect(review).toBeNull();
    });
  });

  describe('update', () => {
    it('should update review content', async () => {
      const updatedReview = await Review.update(testReview.review_id, {
        content: 'Updated self-evaluation content.'
      });

      expect(updatedReview.content).toBe('Updated self-evaluation content.');
      expect(updatedReview.status).toBe('draft');
    });

    it('should update review status', async () => {
      const updatedReview = await Review.update(testReview.review_id, {
        status: 'submitted'
      });

      expect(updatedReview.status).toBe('submitted');
      expect(updatedReview.submitted_at).toBeDefined();
    });

    it('should throw error when no fields to update', async () => {
      await expect(async () => {
        await Review.update(testReview.review_id, {});
      }).rejects.toThrow('No fields to update');
    });
  });

  describe('submit', () => {
    it('should submit a draft review', async () => {
      // Create a new draft
      const draftReview = await Review.create({
        reviewCycleId: testCycle.review_cycle_id,
        reviewerId: testUser2.user_id,
        revieweeId: testUser2.user_id,
        reviewType: 'self',
        content: 'Draft to be submitted',
        status: 'draft'
      });

      const submitted = await Review.submit(draftReview.review_id);

      expect(submitted.status).toBe('submitted');
      expect(submitted.submitted_at).toBeDefined();
    });
  });

  describe('revertToDraft', () => {
    it('should revert submitted review to draft', async () => {
      const reverted = await Review.revertToDraft(testReview.review_id);

      expect(reverted.status).toBe('draft');
      expect(reverted.submitted_at).toBeNull();
    });
  });

  describe('releaseToEmployee', () => {
    it('should release manager review to employee', async () => {
      // Create and submit a manager review
      const managerReview = await Review.create({
        reviewCycleId: testCycle.review_cycle_id,
        reviewerId: testUser2.user_id,
        revieweeId: testUser1.user_id,
        reviewType: 'manager',
        content: 'Manager evaluation for employee',
        status: 'submitted'
      });

      const released = await Review.releaseToEmployee(managerReview.review_id);

      expect(released.is_released_to_employee).toBe(true);
      expect(released.released_at).toBeDefined();
    });
  });

  describe('getReviewsForReviewee', () => {
    it('should get all reviews for a reviewee', async () => {
      const reviews = await Review.getReviewsForReviewee(
        testCycle.review_cycle_id,
        testUser1.user_id
      );

      expect(reviews).toBeDefined();
      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews[0].reviewer_first_name).toBeDefined();
      expect(reviews[0].reviewer_last_name).toBeDefined();
    });
  });

  describe('getReviewsByReviewer', () => {
    it('should get all reviews by a specific reviewer', async () => {
      const reviews = await Review.getReviewsByReviewer(testUser1.user_id);

      expect(reviews).toBeDefined();
      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews[0].reviewee_first_name).toBeDefined();
      expect(reviews[0].reviewee_job_title).toBeDefined();
    });

    it('should filter reviews by cycle', async () => {
      const reviews = await Review.getReviewsByReviewer(
        testUser1.user_id,
        testCycle.review_cycle_id
      );

      expect(reviews).toBeDefined();
      reviews.forEach(review => {
        expect(review.review_cycle_id).toBe(testCycle.review_cycle_id);
      });
    });
  });

  describe('get360Reviews', () => {
    it('should get only 360 reviews for a reviewee', async () => {
      const reviews = await Review.get360Reviews(
        testCycle.review_cycle_id,
        testUser1.user_id
      );

      expect(reviews).toBeDefined();
      reviews.forEach(review => {
        expect(review.review_type).toBe('peer_360');
        expect(review.reviewee_id).toBe(testUser1.user_id);
      });
    });
  });

  describe('getReviewStats', () => {
    it('should return review statistics for a cycle', async () => {
      const stats = await Review.getReviewStats(testCycle.review_cycle_id);

      expect(stats).toBeDefined();
      expect(Array.isArray(stats)).toBe(true);

      if (stats.length > 0) {
        expect(stats[0].review_type).toBeDefined();
        expect(stats[0].status).toBeDefined();
        expect(stats[0].count).toBeDefined();
      }
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      // Create a review to delete
      const reviewToDelete = await Review.create({
        reviewCycleId: testCycle.review_cycle_id,
        reviewerId: testUser3.user_id,
        revieweeId: testUser3.user_id,
        reviewType: 'self',
        content: 'To be deleted',
        status: 'draft'
      });

      await Review.deleteReview(reviewToDelete.review_id);

      const deleted = await Review.findById(reviewToDelete.review_id);
      expect(deleted).toBeNull();
    });
  });
});
