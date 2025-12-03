import type { PageLoad } from './$types';
import { centrifugeClient, ThreadApi } from '$lib/api';
import { ApiClient } from '$lib/api/client';

export const load: PageLoad = async ({ params, fetch }) => {
  ApiClient.setFetch(fetch);

  const spool_id = Number(params.id);

  await centrifugeClient.getTokens(spool_id);

  const threadsPromise = ThreadApi.getSpoolThreads({ spool_id });

  return {
    spoolId: spool_id,
    threads: threadsPromise
  };
};
