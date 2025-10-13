import type { PageLoad } from './$types';
import { ThreadApi } from '$lib/api';

export const load: PageLoad = async ({ params, parent }) => {
  const spool_id = Number(params.id);

  const { spools } = await parent();

  const threadsPromise = ThreadApi.getSpoolThreads({ spool_id });

  return {
    spools: spools,
    threads: threadsPromise
  };
};
