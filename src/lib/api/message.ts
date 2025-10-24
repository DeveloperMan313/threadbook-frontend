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
    userPfp: '',
    text: 'hi, how everyone doing?',
    createdAt: new Date()
  },
  {
    id: 2,
    username: 'Bob',
    userPfp: '',
    text: 'doing great, hbu?',
    createdAt: new Date()
  }
];

export const MessageApi = {
  /**
   * Get messages in a thread
   * @param {GetThreadMessagesRequest} request - request object
   * @returns {Promise<Array<MessageProps>>} - API response
   */
  async getThreadMessages(request: GetThreadMessagesRequest): Promise<Array<MessageProps>> {
    await new Promise((r) => setTimeout(r, 200)); // emulate API delay
    return MockGetThreadMessages;
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
    return {};
    return ApiClient.fetchJSON(`/thread/${request.thread_id}/messages/send`, {
      method: 'POST',
      body: JSON.stringify(request.message)
    });
  },

  /**
   * Init receiver websocket connection for a thread
   * @param {InitThreadWebsocketRequest} request - request object
   */
  async initThreadWebsocket(
    request: InitThreadWebsocketRequest,
    onMessage: (message: MessageProps) => void
  ) {
    const startRandomMessages = () => {
      const getRandomInterval = () => Math.random() * 5000 + 2000;
      const getRandomNumber = () => Math.floor(Math.random() * 1000);
      const sendRandomMessage = () => {
        const randomMessage: MessageProps = {
          id: Date.now(),
          username: 'Bot',
          userPfp: '',
          text: `Random number: ${getRandomNumber()}`,
          createdAt: new Date()
        };
        onMessage(randomMessage);
        setTimeout(sendRandomMessage, getRandomInterval());
      };
      setTimeout(sendRandomMessage, getRandomInterval());
    };
    startRandomMessages();

    return {
      close: () => {
        console.log('WebSocket simulation closed');
      }
    };
  }
};
