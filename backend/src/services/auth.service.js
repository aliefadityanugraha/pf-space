/**
 * src/services/auth.service.js
 * 
 * Service for user-related business logic, including profile updates, 
 * identity verification, and role management.
 */

import { User, Role } from '../models/index.js';
import { deleteFile } from '../lib/upload.js';

export class AuthService {
  /**
   * Get a user by their ID with their role information
   * @param {string} id - User ID
   * @returns {Promise<User|null>} User object or null
   */
  async getUserById(id) {
    return User.query()
      .findById(id)
      .withGraphFetched('role');
  }

  /**
   * Get a user by their email with their role information
   * @param {string} email - User email
   * @returns {Promise<User|null>} User object or null
   */
  async getUserByEmail(email) {
    return User.query()
      .findOne({ email })
      .withGraphFetched('role');
  }

  /**
   * Update a user's role
   * @param {string} userId - User ID
   * @param {number} roleId - New role ID
   * @returns {Promise<User>} Updated user object
   */
  async updateUserRole(userId, roleId) {
    return User.query()
      .patchAndFetchById(userId, { role_id: roleId })
      .withGraphFetched('role');
  }

  /**
   * Update user profile data, including handling avatar image replacement
   * @param {string} userId - User ID
   * @param {object} data - Data to update (e.g., name, image)
   * @returns {Promise<User>} Updated user object
   */
  async updateUser(userId, data) {
    // If updating image, delete old one (only if it's a local file)
    if (data.image) {
      const currentUser = await this.getUserById(userId);
      if (currentUser && currentUser.image) {
        // Only delete if it's a local file path (starts with /uploads)
        // Don't delete external URLs (Google OAuth, etc.)
        if (currentUser.image.startsWith('/uploads')) {
          try {
            await deleteFile(currentUser.image);
          } catch (error) {
            console.warn('Failed to delete old profile image:', error.message);
            // Continue with update even if delete fails
          }
        }
      }
    }
    return User.query()
      .patchAndFetchById(userId, data)
      .withGraphFetched('role');
  }

  /**
   * Get all users in the system
   * @returns {Promise<User[]>} Array of user objects
   */
  async getAllUsers() {
    return User.query()
      .select('id', 'email', 'name', 'role_id', 'image', 'createdAt')
      .withGraphFetched('role');
  }

  /**
   * Get all available user roles
   * @returns {Promise<Role[]>} Array of role objects
   */
  async getAllRoles() {
    return Role.query();
  }

  /**
   * Get a specific role by its name
   * @param {string} name - Role name
   * @returns {Promise<Role|null>} Role object or null
   */
  async getRoleByName(name) {
    return Role.query().findOne({ name });
  }
}

export const authService = new AuthService();
