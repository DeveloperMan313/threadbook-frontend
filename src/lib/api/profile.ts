import { ApiClient } from './client';
import type { GetProfilesRequest, GetProfilesResponse, UpdateProfileRequest, UserProfilePublic } from '$lib/types';

export const ProfileApi = {
  /**
   * Get list of profiles by usernames
   * @param {GetProfilesRequest} request - request object
   * @returns {Promise<GetProfilesResponse>} - API response
   */
  async getProfiles(request: GetProfilesRequest): Promise<GetProfilesResponse> {
    return ApiClient.fetchJSON('/profile/get', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  },

  /**
   * Update own's profile
   * @param {UpdateProfileRequest} request - request object
   * @returns {Promise<UserProfilePublic>} - API response
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UserProfilePublic> {
    if (!request.nickname && !request.avatar) {
      throw Error('should pass at least one field');
    }

    const formData = new FormData();
    if (request.nickname) formData.append('nickname', request.nickname);
    if (request.avatar) formData.append('avatar', request.avatar);

    return ApiClient.fetchJSON('/profile/edit', {
      method: 'POST',
      headers: {},
      body: formData
    });
  }
};
