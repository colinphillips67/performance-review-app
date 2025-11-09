import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { jwtConfig } from '../config/jwt.js';
import * as authService from '../services/authService.js';

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Email and password are required'
        }
      });
    }

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Authenticate user
    const result = await authService.authenticate(email, password, ipAddress, userAgent);

    // If 2FA is required, return intermediate response
    if (result.requiresTwoFactor) {
      return res.status(200).json({
        requiresTwoFactor: true,
        userId: result.userId,
        message: result.message
      });
    }

    // Return successful login response
    res.status(200).json({
      success: true,
      token: result.token,
      expiresIn: result.expiresIn,
      user: result.user
    });

  } catch (error) {
    console.error('Login error:', error);

    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    if (error.message === 'ACCOUNT_INACTIVE') {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account has been deactivated. Please contact an administrator.'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login'
      }
    });
  }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided'
        }
      });
    }

    const token = authHeader.substring(7);

    // Invalidate the session
    await authService.logout(token);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during logout'
      }
    });
  }
};

/**
 * Forgot password
 * NOTE: This is a simplified implementation. In production, this should:
 * 1. Generate a secure reset token
 * 2. Store it with expiration in the database
 * 3. Send the token via email (not return it in response)
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Email is required'
        }
      });
    }

    // For now, just return a success message
    // In production, this would send an email with a reset link
    // We don't reveal whether the email exists for security reasons
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

    // TODO: Implement email sending with reset token
    // const resetToken = crypto.randomBytes(32).toString('hex');
    // Store resetToken in database with expiration
    // Send email with reset link containing token

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred processing your request'
      }
    });
  }
};

/**
 * Reset password
 * NOTE: This is a simplified implementation that changes password for authenticated users.
 * In production, this would accept a reset token from the forgot password flow.
 */
export const resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId; // From auth middleware

    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to change your password'
        }
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Current password and new password are required'
        }
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'New password must be at least 8 characters long'
        }
      });
    }

    // Change password
    await authService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (error.message === 'INVALID_PASSWORD') {
      return res.status(401).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred changing your password'
      }
    });
  }
};

/**
 * Setup 2FA
 * Generates a 2FA secret and QR code for the user
 */
export const setup2FA = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to setup 2FA'
        }
      });
    }

    // Generate 2FA secret
    const { secret, qrCodeUrl } = await authService.generate2FASecret(userId, userEmail);

    res.status(200).json({
      success: true,
      secret,
      qrCodeUrl,
      message: 'Scan the QR code with your authenticator app and verify with a code to enable 2FA'
    });

  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred setting up 2FA'
      }
    });
  }
};

/**
 * Verify 2FA
 * Verifies the 2FA token and enables 2FA if during setup, or completes login if during authentication
 */
export const verify2FA = async (req, res) => {
  try {
    const { token, secret, userId } = req.body;

    if (!token) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: '2FA token is required'
        }
      });
    }

    // Case 1: Enabling 2FA (user is logged in, providing secret from setup)
    if (secret) {
      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to enable 2FA'
          }
        });
      }

      await authService.enable2FA(currentUserId, secret, token);

      return res.status(200).json({
        success: true,
        message: '2FA has been enabled successfully'
      });
    }

    // Case 2: Logging in with 2FA (userId provided from login endpoint)
    if (userId) {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.verify2FAAndAuthenticate(userId, token, ipAddress, userAgent);

      return res.status(200).json({
        success: true,
        token: result.token,
        expiresIn: result.expiresIn,
        user: result.user
      });
    }

    // Neither secret nor userId provided
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'Either secret (for enabling) or userId (for login) is required'
      }
    });

  } catch (error) {
    console.error('Verify 2FA error:', error);

    if (error.message === 'INVALID_2FA_TOKEN') {
      return res.status(401).json({
        error: {
          code: 'INVALID_2FA_TOKEN',
          message: 'Invalid 2FA token. Please try again.'
        }
      });
    }

    if (error.message === 'INVALID_2FA_SETUP') {
      return res.status(400).json({
        error: {
          code: 'INVALID_2FA_SETUP',
          message: '2FA is not properly set up for this user'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred verifying 2FA'
      }
    });
  }
};

/**
 * Disable 2FA
 */
export const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to disable 2FA'
        }
      });
    }

    if (!password) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Password is required to disable 2FA'
        }
      });
    }

    await authService.disable2FA(userId, password);

    res.status(200).json({
      success: true,
      message: '2FA has been disabled. All sessions have been logged out for security.'
    });

  } catch (error) {
    console.error('Disable 2FA error:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (error.message === 'INVALID_PASSWORD') {
      return res.status(401).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Incorrect password'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred disabling 2FA'
      }
    });
  }
};

/**
 * Validate session
 */
export const validateSession = async (req, res) => {
  // req.user from auth middleware already has camelCase properties
  // (userId, email, isAdmin) but we should return it consistently
  res.json({
    valid: true,
    user: req.user
  });
};
