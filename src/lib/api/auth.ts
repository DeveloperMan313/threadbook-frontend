import { ApiClient } from './client';
import type {
  RegisterRequest,
  LogInRequest,
  UserProfileFull,
  CheckEmailRequest,
  CheckUsernameRequest,
  CheckEmailResponse,
  CheckUsernameResponse
} from '$lib/types';

export const AuthApi = {
  /**
   * Get auth info
   * @returns {Promise<UserProfileFull>} - API response
   */
  async getAuth(): Promise<UserProfileFull> {
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
   * @param {LogInRequest} request - request object
   * @returns {Promise<UserProfileFull>} - API response
   */
  async logIn(request: LogInRequest): Promise<UserProfileFull> {
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
  },

  /**
   * Check if email exists
   * @param {CheckEmailRequest} request - request object
   * @returns {Promise<CheckEmailResponse>} - API response
   */
  async checkEmail(request: CheckEmailRequest): Promise<CheckEmailResponse> {
    return ApiClient.fetchJSON('/auth/validation/email', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  },

  /**
   * Check if username exists
   * @param {CheckUsernameRequest} request - request object
   * @returns {Promise<CheckUsernameResponse>} - API response
   */
  async checkUsername(request: CheckUsernameRequest): Promise<CheckUsernameResponse> {
    return ApiClient.fetchJSON('/auth/validation/username', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }
};
