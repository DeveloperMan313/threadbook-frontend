import type { LayoutLoad } from './$types';
import { CentrifugeClient, SpoolApi } from '$lib/api';
import { tryInitUserProfile } from '$lib/userProfile';

export const load: LayoutLoad = async () => {
  if (!tryInitUserProfile()) return;
  CentrifugeClient.connect();

  const spoolDockProps = await SpoolApi.getUserSpoolList();

  return {
    spools: spoolDockProps.spools
  };
};
