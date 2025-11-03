import type { PageLoad } from './$types';
import { SpoolApi } from '$lib/api';

export const load: PageLoad = async () => {
  const spoolDockProps = await SpoolApi.getUserSpoolList();

  return {
    spools: spoolDockProps.spools
  };
};
