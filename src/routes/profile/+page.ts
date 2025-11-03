import type { PageLoad } from './$types';
import { tryGetUserProfile } from '$lib/helpers';

export const load: PageLoad = async () => {
  const userProfile = tryGetUserProfile();
  if (!userProfile) return;

  return {
    userProfile
  };
};
