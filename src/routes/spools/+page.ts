import type { PageLoad } from './$types';
import { SpoolApi } from '$lib/api/spool';

export const load: PageLoad = async () => {
  return {
    spools: await SpoolApi.getUserSpoolList()
  };
};
