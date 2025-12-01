import type { LayoutLoad } from './$types';
import { centrifugeClient } from '$lib/api';
import { stateSpoolsFetch, subToSpoolEvents, tryGetUserProfile } from '$lib/states';
import { ApiClient } from '$lib/api/client';

export const load: LayoutLoad = async ({ fetch }) => {
  ApiClient.setFetch(fetch);

  await stateSpoolsFetch();

  await centrifugeClient.connect();
  centrifugeClient.subToUser();
  subToSpoolEvents();

  const isAuthorized = await tryGetUserProfile();

  return {
    isAuthorized
  };
};
