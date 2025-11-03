import type { PageLoad } from './$types';
import { tryGetUserProfile } from '$lib/userProfile';

export const load: PageLoad = async () => {
  await tryGetUserProfile();
};
