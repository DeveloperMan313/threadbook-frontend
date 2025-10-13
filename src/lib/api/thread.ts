import { ApiClient } from './client';
import type { ThreadEntryProps } from '$lib/types';

const MockGetSpoolThreads: Array<ThreadEntryProps> = [
  {
    id: 1,
    title: 'my secret lair',
    type: 'private',
    unreadCnt: 21,
    mentionCnt: 1
  },
  {
    id: 2,
    title: 'great surprise',
    type: 'private',
    unreadCnt: 5,
    mentionCnt: 0
  },
  {
    id: 3,
    title: 'general',
    type: 'public',
    unreadCnt: 122,
    mentionCnt: 3
  },
  {
    id: 4,
    title: 'memes',
    type: 'public',
    unreadCnt: 59,
    mentionCnt: 0
  },
  {
    id: 5,
    title: 'gaming 04.09 night',
    type: 'history',
    unreadCnt: 0,
    mentionCnt: 0
  },
  {
    id: 6,
    title: 'discussion abt dogs',
    type: 'history',
    unreadCnt: 0,
    mentionCnt: 0
  }
];

export const ThreadApi = {
  /**
   * Get threads in a spool
   * @param {number} spool_id - spool id
   * @returns {Promise<Array<ThreadEntryProps>>} - API response
   */
  async getSpoolThreads(spool_id: number): Promise<Array<ThreadEntryProps>> {
    await new Promise((r) => setTimeout(r, 2000)); // emulate API delay
    return MockGetSpoolThreads;
    return ApiClient.fetchJSON('/thread/get', {
      method: 'GET',
      body: JSON.stringify({
        spool_id
      })
    }) as Promise<Array<ThreadEntryProps>>;
  }
};
