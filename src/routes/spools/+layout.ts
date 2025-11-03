import type { LayoutLoad } from './$types';
import { SpoolApi } from '$lib/api';
import { tryGetUserProfile } from '$lib/userProfile';

export const load: LayoutLoad = async () => {
  if (!(await tryGetUserProfile())) return;

  const spoolDockProps = await SpoolApi.getUserSpoolList();

  return {
    spools: spoolDockProps.spools
  };
};
