import type { LayoutLoad } from './$types';
import { SpoolApi } from '$lib/api';

export const load: LayoutLoad = async () => {
  const spoolDockProps = await SpoolApi.getUserSpoolList();

  return {
    spools: spoolDockProps.spools
  };
};
