import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import crypto from 'crypto';
import { jwtConfig } from '../config/jwt.js';
import * as User from '../models/User.js';
import * as Session from '../models/Session.js';

/**
 * Authentication Service
 * Handles business logic for authentication operations
 */

const SALT_ROUNDS = 10;

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  // Add a unique identifier (jti) to ensure each token is unique
  // This prevents duplicate token errors when multiple sessions are created quickly
  const tokenPayload = {
    ...payload,
    jti: crypto.randomBytes(16).toString('hex') // JWT ID for uniqueness
  };

  return jwt.sign(tokenPayload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    return null;
  }
};

/**
 * Calculate token expiration date
 * @param {string} expiresIn - Duration string (e.g., '2h', '7d')
 * @returns {Date} Expiration date
 */
const calculateExpirationDate = (expiresIn) => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expiration format');
  }

  const value = parseInt(match[1]);
  const unit = match[2];
  const now = new Date();

  switch (unit) {
    case 's': return new Date(now.getTime() + value * 1000);
    case 'm': return new Date(now.getTime() + value * 60 * 1000);
    case 'h': return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd': return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default: throw new Error('Invalid time unit');
  }
};

/**
 * Authenticate user and create session
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} [ipAddress] - Client IP address
 * @param {string} [userAgent] - Client user agent
 * @returns {Promise<Object>} Authentication result with token and user
 * @throws {Error} If authentication fails
 */
export const authenticate = async (email, password, ipAddress, userAgent) => {
  // Find user by email
  const user = await User.findByEmail(email);

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new Error('ACCOUNT_INACTIVE');
  }

  // Compare password
  const passwordMatch = await comparePassword(password, user.password_hash);

  if (!passwordMatch) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Check if 2FA is enabled
  if (user.two_fa_enabled) {
    // Return intermediate response - 2FA required
    return {
      requiresTwoFactor: true,
      userId: user.user_id,
      message: '2FA verification required'
    };
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.user_id,
    email: user.email,
    isAdmin: user.is_admin
  });

  // Calculate expiration
  const expiresAt = calculateExpirationDate(jwtConfig.expiresIn);

  // Create session in database
  await Session.create({
    userId: user.user_id,
    token,
    expiresAt,
    ipAddress,
    userAgent
  });

  // Update last login
  await User.updateLastLogin(user.user_id);

  // Remove sensitive data and convert to camelCase for frontend
  const { password_hash, two_fa_secret, ...userWithoutSensitiveData } = user;

  return {
    requiresTwoFactor: false,
    token,
    expiresIn: jwtConfig.expiresIn,
    user: {
      userId: userWithoutSensitiveData.user_id,
      email: userWithoutSensitiveData.email,
      firstName: userWithoutSensitiveData.first_name,
      lastName: userWithoutSensitiveData.last_name,
      jobTitle: userWithoutSensitiveData.job_title,
      isAdmin: userWithoutSensitiveData.is_admin,
      isActive: userWithoutSensitiveData.is_active,
      twoFaEnabled: userWithoutSensitiveData.two_fa_enabled,
      createdAt: userWithoutSensitiveData.created_at,
      updatedAt: userWithoutSensitiveData.updated_at,
      lastLogin: userWithoutSensitiveData.last_login
    }
  };
};

/**
 * Verify 2FA token and complete authentication
 * @param {string} userId - User's UUID
 * @param {string} token - 2FA token
 * @param {string} [ipAddress] - Client IP address
 * @param {string} [userAgent] - Client user agent
 * @returns {Promise<Object>} Authentication result with JWT token and user
 * @throws {Error} If verification fails
 */
export const verify2FAAndAuthenticate = async (userId, token, ipAddress, userAgent) => {
  const user = await User.findById(userId);

  if (!user || !user.two_fa_enabled || !user.two_fa_secret) {
    throw new Error('INVALID_2FA_SETUP');
  }

  // Verify the 2FA token
  const verified = speakeasy.totp.verify({
    secret: user.two_fa_secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps before/after current
  });

  if (!verified) {
    throw new Error('INVALID_2FA_TOKEN');
  }

  // Generate JWT token
  const jwtToken = generateToken({
    userId: user.user_id,
    email: user.email,
    isAdmin: user.is_admin
  });

  // Calculate expiration
  const expiresAt = calculateExpirationDate(jwtConfig.expiresIn);

  // Create session in database
  await Session.create({
    userId: user.user_id,
    token: jwtToken,
    expiresAt,
    ipAddress,
    userAgent
  });

  // Update last login
  await User.updateLastLogin(user.user_id);

  // Remove sensitive data and convert to camelCase for frontend
  const { password_hash, two_fa_secret, ...userWithoutSensitiveData } = user;

  return {
    token: jwtToken,
    expiresIn: jwtConfig.expiresIn,
    user: {
      userId: userWithoutSensitiveData.user_id,
      email: userWithoutSensitiveData.email,
      firstName: userWithoutSensitiveData.first_name,
      lastName: userWithoutSensitiveData.last_name,
      jobTitle: userWithoutSensitiveData.job_title,
      isAdmin: userWithoutSensitiveData.is_admin,
      isActive: userWithoutSensitiveData.is_active,
      twoFaEnabled: userWithoutSensitiveData.two_fa_enabled,
      createdAt: userWithoutSensitiveData.created_at,
      updatedAt: userWithoutSensitiveData.updated_at,
      lastLogin: userWithoutSensitiveData.last_login
    }
  };
};

/**
 * Logout user (invalidate session)
 * @param {string} token - JWT token
 * @returns {Promise<void>}
 */
export const logout = async (token) => {
  await Session.deleteByToken(token);
};

/**
 * Register a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.jobTitle - User's job title
 * @param {boolean} [userData.isAdmin=false] - Whether user is admin
 * @returns {Promise<Object>} Created user (without password)
 * @throws {Error} If user already exists
 */
export const register = async (userData) => {
  const { email, password, firstName, lastName, jobTitle, isAdmin = false } = userData;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new Error('USER_ALREADY_EXISTS');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await User.create({
    email,
    firstName,
    lastName,
    jobTitle,
    passwordHash,
    isAdmin
  });

  return user;
};

/**
 * Generate 2FA secret for a user
 * @param {string} userId - User's UUID
 * @param {string} userEmail - User's email
 * @returns {Promise<Object>} 2FA secret and QR code URL
 */
export const generate2FASecret = async (userId, userEmail) => {
  const secret = speakeasy.generateSecret({
    name: `Performance Review System (${userEmail})`,
    length: 32
  });

  return {
    secret: secret.base32,
    qrCodeUrl: secret.otpauth_url
  };
};

/**
 * Enable 2FA for a user
 * @param {string} userId - User's UUID
 * @param {string} secret - 2FA secret
 * @param {string} token - Verification token
 * @returns {Promise<void>}
 * @throws {Error} If token verification fails
 */
export const enable2FA = async (userId, secret, token) => {
  // Verify the token before enabling
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2
  });

  if (!verified) {
    throw new Error('INVALID_2FA_TOKEN');
  }

  // Enable 2FA for the user
  await User.update2FA(userId, true, secret);
};

/**
 * Disable 2FA for a user
 * @param {string} userId - User's UUID
 * @param {string} password - User's password for confirmation
 * @returns {Promise<void>}
 * @throws {Error} If password is incorrect
 */
export const disable2FA = async (userId, password) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Verify password
  const passwordMatch = await comparePassword(password, user.password_hash);

  if (!passwordMatch) {
    throw new Error('INVALID_PASSWORD');
  }

  // Disable 2FA
  await User.update2FA(userId, false, null);

  // Invalidate all sessions for security
  await Session.deleteAllForUser(userId);
};

/**
 * Change user password
 * @param {string} userId - User's UUID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 * @throws {Error} If current password is incorrect
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Verify current password
  const passwordMatch = await comparePassword(currentPassword, user.password_hash);

  if (!passwordMatch) {
    throw new Error('INVALID_PASSWORD');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await User.updatePassword(userId, newPasswordHash);

  // Invalidate all sessions for security
  await Session.deleteAllForUser(userId);
};

export default {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authenticate,
  verify2FAAndAuthenticate,
  logout,
  register,
  generate2FASecret,
  enable2FA,
  disable2FA,
  changePassword
};
