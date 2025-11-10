import type { LayoutLoad } from './$types';
import { CentrifugeClient, SpoolApi } from '$lib/api';
import { tryGetUserProfile } from '$lib/userProfile';

export const load: LayoutLoad = async () => {
  if (!(await tryGetUserProfile())) return;

  const spoolDockProps = await SpoolApi.getUserSpoolList();

  const centrifugeClient = new CentrifugeClient();
  await centrifugeClient.connect();

  return {
    spools: spoolDockProps.spools,
    centrifugeClient
  };
};
