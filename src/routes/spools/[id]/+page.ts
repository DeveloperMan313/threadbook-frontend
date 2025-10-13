import type { PageLoad } from './$types';
import { ThreadApi } from '$lib/api';
import type { ThreadEntryProps } from '$lib/types';
import { defer } from '$lib/utils';

export const load: PageLoad = async ({ params, parent }) => {
  const spoolId = Number(params.id);

  const { spools } = await parent();

  const threadsPromise = defer(
    ThreadApi.getSpoolThreads(spoolId).then((threads) => ({
      private: threads.filter((t: ThreadEntryProps) => t.type == 'private'),
      public: threads.filter((t: ThreadEntryProps) => t.type == 'public'),
      history: threads.filter((t: ThreadEntryProps) => t.type == 'history')
    }))
  );

  return {
    spools: spools,
    threads: threadsPromise
  };
};
