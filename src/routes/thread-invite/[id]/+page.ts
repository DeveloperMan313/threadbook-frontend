import type { PageLoad } from './$types';
import { ApiClient } from '$lib/api/client';
import { tryGetUserProfile } from '$lib/states';

export const load: PageLoad = async ({ fetch }) => {
  ApiClient.setFetch(fetch);

  const isAuthorized = await tryGetUserProfile();

  return {
    isAuthorized
  };
};
