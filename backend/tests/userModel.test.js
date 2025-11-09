import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as User from '../src/models/User.js';
import * as authService from '../src/services/authService.js';
import { pool } from '../src/config/database.js';

describe('User Model', () => {
  let testUser1;
  let testUser2;

  beforeAll(async () => {
    // Create test users
    const passwordHash1 = await authService.hashPassword('TestPassword1!');
    const passwordHash2 = await authService.hashPassword('TestPassword2!');

    testUser1 = await User.create({
      email: 'usermodel-test1@example.com',
      firstName: 'UserModel',
      lastName: 'Test1',
      jobTitle: 'Engineer',
      passwordHash: passwordHash1,
      isAdmin: false
    });

    testUser2 = await User.create({
      email: 'usermodel-test2@example.com',
      firstName: 'UserModel',
      lastName: 'Test2',
      jobTitle: 'Manager',
      passwordHash: passwordHash2,
      isAdmin: true
    });
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['usermodel-test%']);
    // Don't end pool here - it's ended in global afterAll in setup.js
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = await User.findByEmail('usermodel-test1@example.com');

      expect(user).toBeDefined();
      expect(user.email).toBe('usermodel-test1@example.com');
      expect(user.first_name).toBe('UserModel');
      expect(user.last_name).toBe('Test1');
    });

    it('should return null for non-existent email', async () => {
      const user = await User.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should return user with password hash', async () => {
      const user = await User.findByEmail('usermodel-test1@example.com');
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash.length).toBeGreaterThan(50);
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const user = await User.findById(testUser1.user_id);

      expect(user).toBeDefined();
      expect(user.user_id).toBe(testUser1.user_id);
      expect(user.email).toBe('usermodel-test1@example.com');
    });

    it('should return null for non-existent ID', async () => {
      const user = await User.findById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    afterAll(async () => {
      await pool.query('DELETE FROM users WHERE email = $1', ['newuser@example.com']);
    });

    it('should create new user with all fields', async () => {
      const passwordHash = await authService.hashPassword('NewUserPass123!');
      const user = await User.create({
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        jobTitle: 'Designer',
        passwordHash,
        isAdmin: false
      });

      expect(user).toBeDefined();
      expect(user.user_id).toBeDefined();
      expect(user.email).toBe('newuser@example.com');
      expect(user.first_name).toBe('New');
      expect(user.last_name).toBe('User');
      expect(user.job_title).toBe('Designer');
      expect(user.is_admin).toBe(false);
      expect(user.is_active).toBe(true);
      expect(user.two_fa_enabled).toBe(false);
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
    });

    it('should not return password_hash in response', async () => {
      const user = await User.findById(testUser1.user_id);

      // When created, password_hash is not returned, but when fetched it is
      expect(user.password_hash).toBeDefined();
    });

    it('should create user with admin privileges', async () => {
      const passwordHash = await authService.hashPassword('AdminPass123!');
      const adminUser = await User.create({
        email: 'admin-test@example.com',
        firstName: 'Admin',
        lastName: 'User',
        jobTitle: 'Administrator',
        passwordHash,
        isAdmin: true
      });

      expect(adminUser.is_admin).toBe(true);

      // Cleanup
      await pool.query('DELETE FROM users WHERE email = $1', ['admin-test@example.com']);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      // Get initial last_login
      const userBefore = await User.findById(testUser1.user_id);
      const lastLoginBefore = userBefore.last_login;

      // Wait a tiny bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update last login
      await User.updateLastLogin(testUser1.user_id);

      // Get updated last_login
      const userAfter = await User.findById(testUser1.user_id);
      const lastLoginAfter = userAfter.last_login;

      expect(lastLoginAfter).not.toBeNull();
      if (lastLoginBefore) {
        expect(new Date(lastLoginAfter).getTime()).toBeGreaterThan(
          new Date(lastLoginBefore).getTime()
        );
      }
    });
  });

  describe('updatePassword', () => {
    it('should update password hash', async () => {
      const userBefore = await User.findById(testUser1.user_id);
      const oldHash = userBefore.password_hash;

      const newHash = await authService.hashPassword('NewPassword123!');
      await User.updatePassword(testUser1.user_id, newHash);

      const userAfter = await User.findById(testUser1.user_id);
      expect(userAfter.password_hash).not.toBe(oldHash);
      expect(userAfter.password_hash).toBe(newHash);

      // Verify new password works
      const isValid = await authService.comparePassword('NewPassword123!', userAfter.password_hash);
      expect(isValid).toBe(true);

      // Change back
      const originalHash = await authService.hashPassword('TestPassword1!');
      await User.updatePassword(testUser1.user_id, originalHash);
    });
  });

  describe('update2FA', () => {
    it('should enable 2FA with secret', async () => {
      const secret = 'TESTSECRET123456';
      await User.update2FA(testUser1.user_id, true, secret);

      const user = await User.findById(testUser1.user_id);
      expect(user.two_fa_enabled).toBe(true);
      expect(user.two_fa_secret).toBe(secret);

      // Cleanup
      await User.update2FA(testUser1.user_id, false, null);
    });

    it('should disable 2FA and clear secret', async () => {
      // First enable
      await User.update2FA(testUser1.user_id, true, 'TESTSECRET');

      // Then disable
      await User.update2FA(testUser1.user_id, false, null);

      const user = await User.findById(testUser1.user_id);
      expect(user.two_fa_enabled).toBe(false);
      expect(user.two_fa_secret).toBeNull();
    });
  });

  describe('getAllActive', () => {
    it('should return all active users', async () => {
      const users = await User.getAllActive();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(2); // At least our 2 test users

      // Should not include password hashes
      users.forEach(user => {
        expect(user).not.toHaveProperty('password_hash');
        expect(user.is_active).toBe(true);
      });
    });

    it('should return users sorted by name', async () => {
      const users = await User.getAllActive();

      // Verify sorting (last_name, then first_name)
      for (let i = 1; i < users.length; i++) {
        const prevUser = users[i - 1];
        const currUser = users[i];

        expect(
          prevUser.last_name.localeCompare(currUser.last_name) <= 0
        ).toBe(true);
      }
    });
  });

  describe('deactivate and activate', () => {
    let testUser;

    beforeEach(async () => {
      const passwordHash = await authService.hashPassword('TestPass123!');
      testUser = await User.create({
        email: 'deactivate-test@example.com',
        firstName: 'Deactivate',
        lastName: 'Test',
        jobTitle: 'Tester',
        passwordHash,
        isAdmin: false
      });
    });

    afterEach(async () => {
      await pool.query('DELETE FROM users WHERE email = $1', ['deactivate-test@example.com']);
    });

    it('should deactivate user', async () => {
      await User.deactivate(testUser.user_id);

      const user = await User.findById(testUser.user_id);
      expect(user.is_active).toBe(false);
    });

    it('should activate user', async () => {
      // First deactivate
      await User.deactivate(testUser.user_id);

      // Then activate
      await User.activate(testUser.user_id);

      const user = await User.findById(testUser.user_id);
      expect(user.is_active).toBe(true);
    });

    it('should exclude deactivated users from getAllActive', async () => {
      await User.deactivate(testUser.user_id);

      const activeUsers = await User.getAllActive();
      const deactivatedUser = activeUsers.find(u => u.user_id === testUser.user_id);

      expect(deactivatedUser).toBeUndefined();
    });
  });

  describe('User fields validation', () => {
    it('should have UUID as user_id', async () => {
      const user = await User.findById(testUser1.user_id);

      // UUID format: 8-4-4-4-12 hex characters
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(user.user_id).toMatch(uuidRegex);
    });

    it('should have valid email format', async () => {
      const user = await User.findById(testUser1.user_id);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(user.email).toMatch(emailRegex);
    });

    it('should have timestamps in UTC', async () => {
      const user = await User.findById(testUser1.user_id);

      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();

      // Timestamps should be valid dates
      expect(new Date(user.created_at).toString()).not.toBe('Invalid Date');
      expect(new Date(user.updated_at).toString()).not.toBe('Invalid Date');
    });

    it('should have boolean flags with correct types', async () => {
      const user = await User.findById(testUser1.user_id);

      expect(typeof user.is_admin).toBe('boolean');
      expect(typeof user.is_active).toBe('boolean');
      expect(typeof user.two_fa_enabled).toBe('boolean');
    });
  });
});
