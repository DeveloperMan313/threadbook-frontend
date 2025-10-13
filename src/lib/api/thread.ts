import { ApiClient } from './client';
import type { ThreadInfo } from '$lib/types';

const MockGetSpoolThreads: Array<ThreadInfo> = [
  {
    ok: true,
    id: 1,
    title: 'my secret lair',
    type: 'private',
    unreadCnt: 21,
    mentionCnt: 1
  },
  {
    ok: true,
    id: 2,
    title: 'great surprise',
    type: 'private',
    unreadCnt: 5,
    mentionCnt: 0
  },
  {
    ok: true,
    id: 3,
    title: 'general',
    type: 'public',
    unreadCnt: 122,
    mentionCnt: 3
  },
  {
    ok: true,
    id: 4,
    title: 'memes',
    type: 'public',
    unreadCnt: 59,
    mentionCnt: 0
  },
  {
    ok: true,
    id: 5,
    title: 'gaming 04.09 night',
    type: 'history',
    unreadCnt: 0,
    mentionCnt: 0
  },
  {
    ok: true,
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
   * @returns {Promise<Array<ThreadInfo>>} - API response
   */
  async getSpoolThreads(spool_id: number): Promise<Array<ThreadInfo>> {
    await new Promise((r) => setTimeout(r, 2000)); // emulate API delay
    return MockGetSpoolThreads;
    const response = await ApiClient.fetch('/thread/get', {
      method: 'GET',
      body: JSON.stringify({
        spool_id
      })
    });
    const json = await response.json();
    return { ok: response.ok, ...json };
  }
};
