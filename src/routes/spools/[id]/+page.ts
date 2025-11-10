import type { PageLoad } from './$types';
import { ThreadApi } from '$lib/api';
import { ApiClient } from '$lib/api/client';

export const load: PageLoad = async ({ params, parent, fetch }) => {
  ApiClient.setFetch(fetch);

  const spool_id = Number(params.id);

  const { spools, centrifugeClient } = await parent();

  centrifugeClient!.getSpoolTokens(spool_id);

  const threadsPromise = ThreadApi.getSpoolThreads({ spool_id });

  return {
    spoolId: spool_id,
    spools: spools!,
    threads: threadsPromise,
    centrifugeClient: centrifugeClient!
  };
};
