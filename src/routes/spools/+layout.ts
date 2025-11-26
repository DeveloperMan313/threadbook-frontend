import type { LayoutLoad } from './$types';
import { centrifugeClient, SpoolApi } from '$lib/api';
import { tryGetUserProfile } from '$lib/states';
import { ApiClient } from '$lib/api/client';
import { stateSpools } from '$lib/states';

export const load: LayoutLoad = async ({ fetch }) => {
  ApiClient.setFetch(fetch);

  stateSpools.spools = await SpoolApi.getUserSpoolList();

  await centrifugeClient.connect();

  const isAuthorized = await tryGetUserProfile();

  return {
    isAuthorized
  };
};
