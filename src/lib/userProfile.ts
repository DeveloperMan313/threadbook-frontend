import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { UserProfileFull } from '$lib/types';
import { writable } from 'svelte/store';

export const userProfile = writable<UserProfileFull | null>(null);

/**
 * Tries to init user profile data and if not present redirects to /signin
 * @returns {boolean} init is successfull
 */
export const tryInitUserProfile = (): boolean => {
  const profileStored = localStorage.getItem('userProfile');
  if (!profileStored) {
    goto(resolve('/signin'));
    userProfile.set(null);
    return false;
  }
  userProfile.set(JSON.parse(profileStored) as UserProfileFull);
  return true;
}
