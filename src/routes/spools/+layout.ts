import type { LayoutLoad } from './$types';
import { SpoolApi } from '$lib/api';

export const load: LayoutLoad = async () => {
  const response = await SpoolApi.getUserSpoolList();

  return {
    spools: response.spools
  };
};
