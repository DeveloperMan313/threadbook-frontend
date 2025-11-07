import type { PageLoad } from './$types';
import { SpoolApi } from '$lib/api';
import { ApiClient } from '$lib/api/client';

export const load: PageLoad = async ({ fetch }) => {
  ApiClient.setFetch(fetch);

  const spoolDockProps = await SpoolApi.getUserSpoolList();

  return {
    spools: spoolDockProps.spools
  };
};
