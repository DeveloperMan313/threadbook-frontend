import type { LayoutLoad } from './$types';
import { CentrifugeClient, SpoolApi } from '$lib/api';
import { tryGetUserProfile } from '$lib/userProfile';
import { ApiClient } from '$lib/api/client';

export const load: LayoutLoad = async ({ fetch }) => {
  ApiClient.setFetch(fetch);

  if (!(await tryGetUserProfile())) return;

  const spoolDockProps = await SpoolApi.getUserSpoolList();

  const centrifugeClient = new CentrifugeClient();
  await centrifugeClient.connect();

  return {
    spools: spoolDockProps.spools,
    centrifugeClient
  };
};
