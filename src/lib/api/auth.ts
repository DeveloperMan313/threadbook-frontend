import { ApiClient } from './client';
import type { ApiResponse, Credentials } from '$lib/types';

export const AuthApi = {
  /**
   * Get auth info
   * @returns {Promise<ApiResponse>} - API response
   */
  async getAuth(): Promise<ApiResponse> {
    const response = await ApiClient.fetch('/auth/user', {
      method: 'GET',
      headers: {}
    });
    const json = await response.json();
    return { ok: response.ok, ...json };
  },

  /**
   * Register a new user
   * @param {Credentials} credentials - user's credentials
   * @returns {Promise<ApiResponse>} - API response
   */
  async register(credentials: Credentials): Promise<ApiResponse> {
    const response = await ApiClient.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    const json = await response.json();
    return { ok: response.ok, ...json };
  },

  /**
   * Log in to user account
   * @param {Credentials} credentials - user's credentials
   * @returns {Promise<ApiResponse>} - API response
   */
  async logIn(credentials: Credentials): Promise<ApiResponse> {
    const response = await ApiClient.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    const json = await response.json();
    return { ok: response.ok, ...json };
  },

  /**
   * Log out of user account
   * @returns {Promise<ApiResponse>} - API response
   */
  async logOut(): Promise<ApiResponse> {
    const response = await ApiClient.fetch('/auth/logout', {
      method: 'POST',
      headers: {}
    });
    const json = await response.json();
    return { ok: response.ok, ...json };
  }
};
