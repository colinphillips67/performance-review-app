import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/config/database.js';
import * as User from '../src/models/User.js';
import * as Session from '../src/models/Session.js';
import * as authService from '../src/services/authService.js';

describe('Authentication API', () => {
  let testUser;
  let authToken;

  // Setup: Create a test user before all tests
  beforeAll(async () => {
    // Create test user
    testUser = await authService.register({
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      jobTitle: 'Software Engineer',
      isAdmin: false
    });
  });

  // Cleanup: Delete test data after all tests
  afterAll(async () => {
    // Clean up test user and sessions
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [testUser.user_id]);
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    await pool.query('DELETE FROM users WHERE email = $1', ['newuser@example.com']);
    // Don't end pool here - it's ended in global afterAll in setup.js
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('password_hash');

      // Save token for subsequent tests
      authToken = response.body.token;
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'TestPassword123!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_INPUT');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_INPUT');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // Get a fresh token for this test
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
      const freshToken = loginResponse.body.token;

      // Add a small delay to ensure session is committed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Debug: Check if session exists in database
      const sessionCheck = await pool.query(
        'SELECT session_id, user_id, LEFT(token, 30) as token_start, expires_at > NOW() as is_valid FROM sessions WHERE user_id = $1',
        [testUser.user_id]
      );
      console.log('[Test] Sessions in DB for test user:', sessionCheck.rows);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${freshToken}`);

      if (response.status !== 200) {
        console.log('Logout failed:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      // Auth middleware returns UNAUTHORIZED when no token is provided
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should handle logout with already invalid token gracefully', async () => {
      // Get a fresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
      const freshToken = loginResponse.body.token;

      // Logout once
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${freshToken}`)
        .expect(200);

      // Logout twice with same token - second should still succeed (idempotent)
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${freshToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/auth/session', () => {
    beforeEach(async () => {
      // Login to get a fresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.token;
    });

    it('should validate session with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/session')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/session')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/session')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    beforeEach(async () => {
      // Login to get a fresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.token;
    });

    it('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword456!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');

      // Verify old password no longer works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword456!'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');

      // Change back to original password for other tests
      authToken = loginResponse.body.token;
      await request(app)
        .post('/api/auth/reset-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'NewPassword456!',
          newPassword: 'TestPassword123!'
        })
        .expect(200);
    });

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_PASSWORD');
    });

    it('should fail with weak password (less than 8 characters)', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'Short1!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_INPUT');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword456!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return success message for any email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should fail without email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_INPUT');
    });
  });

  describe('2FA Endpoints', () => {
    let twoFASecret;

    beforeEach(async () => {
      // Login to get a fresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.token;
    });

    describe('POST /api/auth/setup-2fa', () => {
      it('should generate 2FA secret and QR code', async () => {
        const response = await request(app)
          .post('/api/auth/setup-2fa')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('secret');
        expect(response.body).toHaveProperty('qrCodeUrl');
        expect(response.body.qrCodeUrl).toContain('otpauth://totp/');

        twoFASecret = response.body.secret;
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .post('/api/auth/setup-2fa')
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/auth/disable-2fa', () => {
      it('should succeed even when 2FA not enabled (idempotent)', async () => {
        const response = await request(app)
          .post('/api/auth/disable-2fa')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            password: 'TestPassword123!'
          })
          .expect(200);

        // Disabling 2FA when it's already disabled is a no-op and should succeed
        expect(response.body).toHaveProperty('success', true);
      });

      it('should fail with incorrect password', async () => {
        const response = await request(app)
          .post('/api/auth/disable-2fa')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            password: 'WrongPassword123!'
          })
          .expect(401);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'INVALID_PASSWORD');
      });

      it('should fail without password', async () => {
        const response = await request(app)
          .post('/api/auth/disable-2fa')
          .set('Authorization', `Bearer ${authToken}`)
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'INVALID_INPUT');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .post('/api/auth/disable-2fa')
          .send({
            password: 'TestPassword123!'
          })
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });
  });
});

describe('User Registration', () => {
  let adminToken;

  beforeAll(async () => {
    // Login as admin to get token (password from seed data)
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!'  // Matches seed data
      });

    if (!loginResponse.body.token) {
      console.error('Admin login failed:', loginResponse.body);
      throw new Error('Failed to login as admin');
    }

    adminToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [
      'newuser@example.com',
      'adminuser@example.com'
    ]);
  });

  describe('POST /api/users (Create User)', () => {
    it('should create a new user successfully', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'NewUserPass123!',
          firstName: 'New',
          lastName: 'User',
          jobTitle: 'Product Manager'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.user).toHaveProperty('is_admin', false);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should fail to create duplicate user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@example.com',
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
          email: 'invalidemail',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          jobTitle: 'Engineer'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_EMAIL');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'testuser@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
          jobTitle: 'Engineer'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'WEAK_PASSWORD');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'incomplete@example.com',
          password: 'Password123!'
          // Missing firstName, lastName, jobTitle
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_INPUT');
    });
  });
});
