import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { UserProfile } from '$lib/types';

/**
 * Tries to get user profile data and if not present redirects to /signin
 * @returns {UserProfile?} user profile data or null
 */
export const tryGetUserProfile = (): UserProfile | null => {
  const profileStored = localStorage.getItem('userProfile');
  if (!profileStored) {
    goto(resolve('/signin'));
    return null;
  }
  return JSON.parse(profileStored) as UserProfile;
}
