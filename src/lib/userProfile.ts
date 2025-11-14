import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { AuthApi } from './api';
import { userProfile } from './writables';

/**
 * Tries to get user profile data from API and if not authorized redirects to /signin
 * @returns {Promise<boolean>} init is successfull
 */
export const tryGetUserProfile = async (): Promise<boolean> => {
  try {
    const profile = await AuthApi.getAuth();
    userProfile.set(profile);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message == 'unouthorized') {
      goto(resolve('/signin'));
    }
  }
  userProfile.set(null);
  return false;
};
