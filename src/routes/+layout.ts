import type { LayoutLoad } from './$types';
import { ApiClient } from '$lib/api/client';
import { tryGetUserProfile } from '$lib/states';

export const load: LayoutLoad = async ({ fetch }) => {
  ApiClient.setFetch(fetch);

  const isAuthorized = await tryGetUserProfile();

  return {
    isAuthorized
  };
};

export const ssr = false;
