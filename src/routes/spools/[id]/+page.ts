import type { PageLoad } from './$types';
import { CentrifugeClient, ThreadApi } from '$lib/api';
import type { SpoolProps } from '$lib/types';

export const load: PageLoad = async ({ params, parent }) => {
  const spool_id = Number(params.id);

  const { spools } = await parent();

  const threadsPromise = ThreadApi.getSpoolThreads({ spool_id });

  const centrifugeClient = new CentrifugeClient();
  await centrifugeClient.connect(spool_id);

  return {
    spools: spools as Array<SpoolProps>,
    threads: threadsPromise,
    centrifugeClient
  };
};
