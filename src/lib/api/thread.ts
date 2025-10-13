import { ApiClient } from './client';
import type {
  ArchiveThreadRequest,
  CreateThreadRequest,
  GetSpoolThreadsRequest,
  UpdateThreadRequest,
  ThreadEntryProps
} from '$lib/types';

const MockGetSpoolThreads: Array<ThreadEntryProps> = [
  {
    id: 1,
    title: 'my secret lair',
    type: 'private',
    is_closed: false,
    unreadCnt: 21,
    mentionCnt: 1
  },
  {
    id: 2,
    title: 'great surprise',
    type: 'private',
    is_closed: false,
    unreadCnt: 5,
    mentionCnt: 0
  },
  {
    id: 3,
    title: 'general',
    type: 'public',
    is_closed: false,
    unreadCnt: 122,
    mentionCnt: 3
  },
  {
    id: 4,
    title: 'memes',
    type: 'public',
    is_closed: false,
    unreadCnt: 59,
    mentionCnt: 0
  },
  {
    id: 5,
    title: 'gaming 04.09 night',
    type: 'public',
    is_closed: false,
    unreadCnt: 0,
    mentionCnt: 0
  },
  {
    id: 6,
    title: 'discussion abt dogs',
    type: 'private',
    is_closed: false,
    unreadCnt: 0,
    mentionCnt: 0
  }
];

export const ThreadApi = {
  /**
   * Get threads in a spool
   * @param {GetSpoolThreadsRequest} request - request object
   * @returns {Promise<Array<ThreadEntryProps>>} - API response
   */
  async getSpoolThreads(request: GetSpoolThreadsRequest): Promise<Array<ThreadEntryProps>> {
    // await new Promise((r) => setTimeout(r, 2000)); // emulate API delay
    // return MockGetSpoolThreads;
    return ApiClient.fetchJSON(`/thread/?spool_id=${request.spool_id}`, {
      method: 'GET',
      headers: {}
    });
  },

  /**
   * Archive thread
   * @param {ArchiveThreadRequest} request - request object
   */
  async archiveThread(request: ArchiveThreadRequest) {
    // await new Promise((r) => setTimeout(r, 750)); // emulate API delay
    // return {};
    return ApiClient.fetchJSON('/thread/close', {
      method: 'PUT',
      body: JSON.stringify(request)
    });
  },

  /**
   * Create thread
   * @param {CreateThreadRequest} request - request object
   */
  async createThread(request: CreateThreadRequest) {
    // await new Promise((r) => setTimeout(r, 750)); // emulate API delay
    // return {};
    return ApiClient.fetchJSON('/thread/create', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  },

  /**
   * Update thread: change title and/or type
   * @param {UpdateThreadRequest} request - request object
   */
  async updateThread(request: UpdateThreadRequest) {
    // await new Promise((r) => setTimeout(r, 500)); // emulate API delay
    // return {};
    return ApiClient.fetchJSON(`/thread/update`, {
      method: 'PUT',
      body: JSON.stringify(request)
    });
  }
};
