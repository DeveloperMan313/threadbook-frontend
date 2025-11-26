import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { AuthApi } from '$lib/api';
import type { UserProfileFull } from '$lib/types';

export const stateProfile = $state<{ profile: UserProfileFull | null }>({ profile: null });

/**
 * Tries to get user profile data from API and if not authorized redirects to /signin
 * @returns {Promise<boolean>} init is successfull
 */
export const tryGetUserProfile = async (): Promise<boolean> => {
  try {
    stateProfile.profile = await AuthApi.getAuth();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message == 'unouthorized') {
      goto(resolve('/signin'));
    }
  }
  stateProfile.profile = null;
  return false;
};
