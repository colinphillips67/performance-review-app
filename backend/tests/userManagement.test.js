import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/config/database.js';
import * as authService from '../src/services/authService.js';

describe('User Management API', () => {
  let adminToken;
  let regularUserToken;
  let adminUserId;
  let regularUserId;
  let testUserId; // User created during tests

  beforeAll(async () => {
    // Create admin user
    const adminUser = await authService.register({
      email: 'admin-test@example.com',
      password: 'AdminPassword123!',
      firstName: 'Admin',
      lastName: 'Test',
      jobTitle: 'System Administrator',
      isAdmin: true
    });
    adminUserId = adminUser.user_id;

    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin-test@example.com',
        password: 'AdminPassword123!'
      });
    adminToken = adminLoginResponse.body.token;

    // Create regular user
    const regularUser = await authService.register({
      email: 'regular-test@example.com',
      password: 'UserPassword123!',
      firstName: 'Regular',
      lastName: 'User',
      jobTitle: 'Software Engineer',
      isAdmin: false
    });
    regularUserId = regularUser.user_id;

    // Login as regular user
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'regular-test@example.com',
        password: 'UserPassword123!'
      });
    regularUserToken = userLoginResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup - delete sessions first, then users
    await pool.query('DELETE FROM sessions WHERE user_id IN ($1, $2, $3)', [
      adminUserId,
      regularUserId,
      testUserId
    ].filter(Boolean));

    await pool.query('DELETE FROM users WHERE email IN ($1, $2, $3)', [
      'admin-test@example.com',
      'regular-test@example.com',
      'created-user@example.com'
    ]);
  });

  describe('GET /api/users', () => {
    it('should get all users as admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);

      // Verify user structure
      const user = response.body.users[0];
      expect(user).toHaveProperty('user_id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('first_name');
      expect(user).toHaveProperty('last_name');
      expect(user).toHaveProperty('job_title');
      expect(user).toHaveProperty('is_admin');
      expect(user).toHaveProperty('is_active');
      expect(user).not.toHaveProperty('password_hash');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });

    it('should fail for non-admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });
  });

  describe('POST /api/users (Create User)', () => {
    it('should create a new user as admin', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'created-user@example.com',
          password: 'NewUserPass123!',
          firstName: 'Created',
          lastName: 'User',
          jobTitle: 'Product Manager',
          isAdmin: false
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'created-user@example.com');
      expect(response.body.user).toHaveProperty('first_name', 'Created');
      expect(response.body.user).toHaveProperty('last_name', 'User');
      expect(response.body.user).toHaveProperty('job_title', 'Product Manager');
      expect(response.body.user).toHaveProperty('is_admin', false);
      expect(response.body.user).not.toHaveProperty('password_hash');

      // Save user ID for cleanup
      testUserId = response.body.user.user_id;
    });

    it('should create an admin user when requested by admin', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new-admin@example.com',
          password: 'AdminPass123!',
          firstName: 'New',
          lastName: 'Admin',
          jobTitle: 'Administrator',
          isAdmin: true
        })
        .expect(201);

      expect(response.body.user).toHaveProperty('is_admin', true);

      // Cleanup
      await pool.query('DELETE FROM sessions WHERE user_id = $1', [response.body.user.user_id]);
      await pool.query('DELETE FROM users WHERE user_id = $1', [response.body.user.user_id]);
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'created-user@example.com', // Already exists
          password: 'AnotherPass123!',
          firstName: 'Duplicate',
          lastName: 'User',
          jobTitle: 'Engineer'
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'USER_ALREADY_EXISTS');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          jobTitle: 'Engineer'
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_EMAIL');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
          jobTitle: 'Engineer'
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'WEAK_PASSWORD');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@example.com',
          password: 'Password123!'
          // Missing firstName, lastName, jobTitle
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_INPUT');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          jobTitle: 'Engineer'
        })
        .expect(401);
    });

    it('should fail for non-admin users', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          jobTitle: 'Engineer'
        })
        .expect(403);

      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });
  });

  describe('GET /api/users/:id (Get Single User)', () => {
    it('should get user by ID as admin', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('user_id', regularUserId);
      expect(response.body.user).toHaveProperty('email', 'regular-test@example.com');
      expect(response.body.user).not.toHaveProperty('password_hash');
      expect(response.body.user).not.toHaveProperty('two_fa_secret');
    });

    it('should allow users to view their own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('user_id', regularUserId);
    });

    it('should prevent users from viewing other profiles', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get(`/api/users/${regularUserId}`)
        .expect(401);
    });
  });

  describe('PUT /api/users/:id (Update User)', () => {
    it('should update user information as admin', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          jobTitle: 'Senior Engineer',
          isAdmin: false,
          isActive: true
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('first_name', 'Updated');
      expect(response.body.user).toHaveProperty('last_name', 'Name');
      expect(response.body.user).toHaveProperty('job_title', 'Senior Engineer');
    });

    it('should update user to admin', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          jobTitle: 'Senior Engineer',
          isAdmin: true,
          isActive: true
        })
        .expect(200);

      expect(response.body.user).toHaveProperty('is_admin', true);

      // Revert back to non-admin
      await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          jobTitle: 'Senior Engineer',
          isAdmin: false,
          isActive: true
        });
    });

    it('should deactivate user', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          jobTitle: 'Senior Engineer',
          isAdmin: false,
          isActive: false
        })
        .expect(200);

      expect(response.body.user).toHaveProperty('is_active', false);

      // Reactivate
      await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          jobTitle: 'Senior Engineer',
          isAdmin: false,
          isActive: true
        });
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated'
          // Missing lastName and jobTitle
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_INPUT');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          jobTitle: 'Engineer'
        })
        .expect(404);

      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .put(`/api/users/${regularUserId}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          jobTitle: 'Engineer'
        })
        .expect(401);
    });

    it('should fail for non-admin users', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          jobTitle: 'Engineer'
        })
        .expect(403);

      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });
  });

  describe('DELETE /api/users/:id (Delete User)', () => {
    let userToDelete;

    beforeAll(async () => {
      // Create a user specifically for deletion testing
      userToDelete = await authService.register({
        email: 'delete-me@example.com',
        password: 'DeleteMe123!',
        firstName: 'Delete',
        lastName: 'Me',
        jobTitle: 'Temporary User',
        isAdmin: false
      });
    });

    it('should delete user as admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${userToDelete.user_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');

      // Verify user is deleted
      const checkUser = await pool.query(
        'SELECT * FROM users WHERE user_id = $1',
        [userToDelete.user_id]
      );
      expect(checkUser.rows.length).toBe(0);
    });

    it('should prevent user from deleting themselves', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'CANNOT_DELETE_SELF');
    });

    it('should cascade delete user sessions', async () => {
      // Create user with session
      const tempUser = await authService.register({
        email: 'cascade-test@example.com',
        password: 'Cascade123!',
        firstName: 'Cascade',
        lastName: 'Test',
        jobTitle: 'Temp User',
        isAdmin: false
      });

      // Login to create session
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'cascade-test@example.com',
          password: 'Cascade123!'
        });

      // Verify session exists
      const sessionsBefore = await pool.query(
        'SELECT * FROM sessions WHERE user_id = $1',
        [tempUser.user_id]
      );
      expect(sessionsBefore.rows.length).toBeGreaterThan(0);

      // Delete user
      await request(app)
        .delete(`/api/users/${tempUser.user_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify sessions are deleted
      const sessionsAfter = await pool.query(
        'SELECT * FROM sessions WHERE user_id = $1',
        [tempUser.user_id]
      );
      expect(sessionsAfter.rows.length).toBe(0);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .delete(`/api/users/${regularUserId}`)
        .expect(401);
    });

    it('should fail for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });
  });

  describe('User Management Integration Tests', () => {
    it('should complete full CRUD lifecycle', async () => {
      // CREATE
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'lifecycle@example.com',
          password: 'Lifecycle123!',
          firstName: 'Lifecycle',
          lastName: 'Test',
          jobTitle: 'QA Engineer',
          isAdmin: false
        })
        .expect(201);

      const userId = createResponse.body.user.user_id;
      expect(userId).toBeDefined();

      // READ (Get single)
      const readResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(readResponse.body.user).toHaveProperty('email', 'lifecycle@example.com');

      // UPDATE
      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Lifecycle',
          jobTitle: 'Senior QA Engineer',
          isAdmin: false,
          isActive: true
        })
        .expect(200);

      expect(updateResponse.body.user).toHaveProperty('first_name', 'Updated');
      expect(updateResponse.body.user).toHaveProperty('job_title', 'Senior QA Engineer');

      // DELETE
      await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should maintain data integrity across operations', async () => {
      // Get initial user count
      const initialResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      const initialCount = initialResponse.body.users.length;

      // Create user
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'integrity@example.com',
          password: 'Integrity123!',
          firstName: 'Integrity',
          lastName: 'Test',
          jobTitle: 'Developer'
        });

      const userId = createResponse.body.user.user_id;

      // Check count increased
      const afterCreateResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(afterCreateResponse.body.users.length).toBe(initialCount + 1);

      // Delete user
      await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Check count returned to initial
      const afterDeleteResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(afterDeleteResponse.body.users.length).toBe(initialCount);
    });
  });
});
