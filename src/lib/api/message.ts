import { ApiClient } from './client';
import type {
  GetThreadMessagesRequest,
  MessageProps,
  SendThreadMessagesRequest,
  InitThreadWebsocketRequest
} from '$lib/types';

const MockGetThreadMessages: Array<MessageProps> = [
  {
    id: 1,
    username: 'Alex',
    content: 'hi, how everyone doing?',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    username: 'Bob',
    content: 'doing great, hbu?',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MessageApi = {
  /**
   * Get messages in a thread
   * @param {GetThreadMessagesRequest} request - request object
   * @returns {Promise<Array<MessageProps>>} - API response
   */
  async getThreadMessages(request: GetThreadMessagesRequest): Promise<Array<MessageProps>> {
    return ApiClient.fetchJSON(`/thread/${request.thread_id}/messages`, {
      method: 'GET',
      headers: {}
    });
  },

  /**
   * Send message in a thread
   * @param {SendThreadMessagesRequest} request - request object
   */
  async sendThreadMessages(request: SendThreadMessagesRequest) {
    return ApiClient.fetchJSON(`/thread/${request.thread_id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: request.content })
    });
  }
};
