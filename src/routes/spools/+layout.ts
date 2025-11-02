import type { LayoutLoad } from './$types';
import { CentrifugeClient, SpoolApi } from '$lib/api';
import { tryGetUserProfile } from '$lib/helpers';

export const load: LayoutLoad = async () => {
  const userProfile = tryGetUserProfile();
  if (!userProfile) return;
  CentrifugeClient.connect();

  const spoolDockProps = await SpoolApi.getUserSpoolList();

  return {
    userProfile,
    spools: spoolDockProps.spools
  };
};
