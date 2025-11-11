import { ApiClient } from './client';
import type { GetThreadMessagesRequest, MessageProps, SendThreadMessagesRequest } from '$lib/types';

const MockGetThreadMessages: Array<MessageProps> = [
  {
    id: 1,
    username: 'Alex',
    content: 'hi, how everyone doing?',
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  },
  {
    id: 2,
    username: 'Bob',
    content: 'doing great, hbu?',
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  }
];

export const MessageApi = {
  /**
   * Get messages in a thread
   * @param {GetThreadMessagesRequest} request - request object
   * @returns {Promise<Array<MessageProps>>} - API response
   */
  async getThreadMessages(request: GetThreadMessagesRequest): Promise<Array<MessageProps>> {
    const params = new URLSearchParams();
    if (request.cursor_id !== undefined) params.append('cursor_id', request.cursor_id.toString());
    if (request.forward !== undefined) params.append('forward', request.forward.toString());
    if (request.limit !== undefined) params.append('limit', request.limit.toString());
    return ApiClient.fetchJSON(`/thread/${request.thread_id}/messages?${params}`, {
      method: 'GET',
      headers: {}
    });
  },

  /**
   * Send message in a thread
   * @param {SendThreadMessagesRequest} request - request object
   */
  async sendThreadMessages(request: SendThreadMessagesRequest) {
    const formData = new FormData();
    formData.append('content', request.content);
    formData.append('files', '');

    return ApiClient.fetchJSON(`/thread/${request.thread_id}/messages`, {
      method: 'POST',
      headers: {},
      body: formData
    });
  }
};
