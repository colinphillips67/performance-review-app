import * as authService from '../services/authService.js';
import * as User from '../models/User.js';

/**
 * Get all users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAllActive();

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred fetching users'
      }
    });
  }
};

/**
 * Create a new user
 * This endpoint can be used for both registration and admin user creation
 */
export const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, jobTitle, isAdmin } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !jobTitle) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Email, password, first name, last name, and job title are required'
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long'
        }
      });
    }

    // Only admins can create admin users
    const requestingUser = req.user;
    const makeAdmin = isAdmin === true;

    if (makeAdmin && (!requestingUser || !requestingUser.isAdmin)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can create admin users'
        }
      });
    }

    // Register the user
    const user = await authService.register({
      email,
      password,
      firstName,
      lastName,
      jobTitle,
      isAdmin: makeAdmin
    });

    res.status(201).json({
      success: true,
      user,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Create user error:', error);

    if (error.message === 'USER_ALREADY_EXISTS') {
      return res.status(409).json({
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'A user with this email already exists'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred creating the user'
      }
    });
  }
};

/**
 * Get a single user by ID
 */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    // Users can only view their own profile unless they're an admin
    if (id !== requestingUser.userId && !requestingUser.isAdmin) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view your own profile'
        }
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Remove password hash from response
    delete user.password_hash;
    delete user.two_fa_secret;

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred fetching user'
      }
    });
  }
};

/**
 * Update a user
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, jobTitle, isAdmin, isActive } = req.body;

    // Validate input
    if (!firstName || !lastName || !jobTitle) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'First name, last name, and job title are required'
        }
      });
    }

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Update user
    const updatedUser = await User.update(id, {
      firstName,
      lastName,
      jobTitle,
      isAdmin: isAdmin === true,
      isActive: isActive !== false // Default to true if not specified
    });

    res.status(200).json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred updating the user'
      }
    });
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    // Prevent users from deleting themselves
    if (id === requestingUser.userId) {
      return res.status(400).json({
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'You cannot delete your own account'
        }
      });
    }

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Delete user
    await User.deleteUser(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred deleting the user'
      }
    });
  }
};

export const adminResetPassword = async (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Not yet implemented' } });
};

export const getLoginHistory = async (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Not yet implemented' } });
};
