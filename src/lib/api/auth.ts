import { ApiClient } from './client';
import type { RegisterRequest, LoginRequest } from '$lib/types';

export const AuthApi = {
  /**
   * Get auth info
   * @returns {Promise<object>} - API response
   */
  async getAuth(): Promise<object> {
    return ApiClient.fetchJSON('/auth/user', {
      method: 'GET',
      headers: {}
    });
  },

  /**
   * Register a new user
   * @param {RegisterRequest} request - request object
   * @returns {Promise<object>} - API response
   */
  async register(request: RegisterRequest): Promise<object> {
    return ApiClient.fetchJSON('/auth/user/register', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  },

  /**
   * Log in to user account
   * @param {LoginRequest} request - request object
   * @returns {Promise<object>} - API response
   */
  async logIn(request: LoginRequest): Promise<object> {
    return ApiClient.fetchJSON('/auth/user/login', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  },

  /**
   * Log out of user account
   * @returns {Promise<object>} - API response
   */
  async logOut(): Promise<object> {
    return ApiClient.fetchJSON('/auth/user/logout', {
      method: 'POST',
      headers: {}
    });
  }
};
