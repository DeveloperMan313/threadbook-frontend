import type { PageLoad } from './$types';
import { SpoolApi } from '$lib/api';
import { ApiClient } from '$lib/api/client';
import { tryGetUserProfile } from '$lib/userProfile';

export const load: PageLoad = async ({ fetch }) => {
  ApiClient.setFetch(fetch);

  if (!(await tryGetUserProfile())) return;

  const spoolDockProps = await SpoolApi.getUserSpoolList();

  return {
    spools: spoolDockProps.spools
  };
};
