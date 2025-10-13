import { ApiClient } from './client';
import type { Credentials } from '$lib/types';

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
   * @param {Credentials} credentials - user's credentials
   * @returns {Promise<object>} - API response
   */
  async register(credentials: Credentials): Promise<object> {
    return ApiClient.fetchJSON('/auth/user/register', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  /**
   * Log in to user account
   * @param {Credentials} credentials - user's credentials
   * @returns {Promise<object>} - API response
   */
  async logIn(credentials: Credentials): Promise<object> {
    return ApiClient.fetchJSON('/auth/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
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
