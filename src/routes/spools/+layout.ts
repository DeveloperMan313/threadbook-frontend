import type { LayoutLoad } from './$types';
import { centrifugeClient, SpoolApi } from '$lib/api';
import { tryGetUserProfile } from '$lib/userProfile';
import { ApiClient } from '$lib/api/client';

export const load: LayoutLoad = async ({ fetch }) => {
  ApiClient.setFetch(fetch);

  const spools = await SpoolApi.getUserSpoolList();

  await centrifugeClient.connect();

  const isAuthorized = await tryGetUserProfile();

  return {
    spools,
    centrifugeClient,
    isAuthorized
  };
};
