import type { PageLoad } from './$types';
import { centrifugeClient, ThreadApi } from '$lib/api';
import { ApiClient } from '$lib/api/client';
import { tryGetUserProfile } from '$lib/userProfile';

export const load: PageLoad = async ({ params, fetch }) => {
  ApiClient.setFetch(fetch);

  const spool_id = Number(params.id);

  await centrifugeClient.getTokens(spool_id);

  const threadsPromise = ThreadApi.getSpoolThreads({ spool_id });

  const isAuthorized = await tryGetUserProfile();

  return {
    spoolId: spool_id,
    threads: threadsPromise,
    isAuthorized
  };
};
