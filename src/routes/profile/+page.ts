import type { PageLoad } from './$types';
import { tryInitUserProfile } from '$lib/userProfile';

export const load: PageLoad = async () => {
  tryInitUserProfile();
};
