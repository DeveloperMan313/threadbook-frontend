import { Centrifuge, type PublicationContext } from 'centrifuge';
import { ThreadApi } from './thread';
import { PUBLIC_CENTRIFUGE_ORIGIN } from '$env/static/public';
import type {
  GetCentrifugeTokensResponse,
  WsMessageCreated,
  WsMessageDeleted,
  WsMessageUpdated,
  WsSpoolDeleted,
  WsSpoolInvited,
  WsSpoolUpdated,
  WsThreadClosed,
  WsThreadCreated,
  WsThreadInvited,
  WsThreadUpdated
} from '$lib/types';
import { stateSpools } from '$lib/states';

type WsMsgHandler<T> = (payload: T) => void;

interface ThreadHandlers {
  'message.created'?: WsMsgHandler<WsMessageCreated>;
  'message.updated'?: WsMsgHandler<WsMessageUpdated>;
  'message.deleted'?: WsMsgHandler<WsMessageDeleted>;
}

let idToThreadHandlers: Record<number, ThreadHandlers> = {};

const routeThreadPublication = (thread_id: number, ctx: PublicationContext) => {
  const type = ctx.data.type as keyof ThreadHandlers;
  if (!(thread_id in idToThreadHandlers)) {
    throw Error(`unknown thread id: ${thread_id}`);
  }
  if (!(type in idToThreadHandlers[thread_id])) {
    throw Error(`unknown message type: ${type}`);
  }
  idToThreadHandlers[thread_id][type]?.(ctx.data.payload);
};

interface UserHandlers {
  'thread.created'?: WsMsgHandler<WsThreadCreated>;
  'thread.updated'?: WsMsgHandler<WsThreadUpdated>;
  'thread.deleted'?: WsMsgHandler<WsThreadClosed>;
  'thread.invited'?: WsMsgHandler<WsThreadInvited>;
  'spool.updated'?: WsMsgHandler<WsSpoolUpdated>;
  'spool.deleted'?: WsMsgHandler<WsSpoolDeleted>;
  'spool.invited'?: WsMsgHandler<WsSpoolInvited>;
}

let userHandlers: UserHandlers = {};

const routeUserPublication = (ctx: PublicationContext) => {
  const type = ctx.data.type as keyof UserHandlers;
  if (!(type in userHandlers)) {
    throw Error(`unknown message type: ${type}`);
  }
  userHandlers[type]?.(ctx.data.payload);
};

let centrifuge: Centrifuge | undefined = undefined;
let tokens: GetCentrifugeTokensResponse | undefined = undefined;
let subbedToChannels: string[] = [];

export const centrifugeClient = {
  async connect(): Promise<void> {
    if (centrifuge) {
      return;
    }

    await this.getTokens();

    centrifuge = new Centrifuge(PUBLIC_CENTRIFUGE_ORIGIN, {
      token: tokens!.ConnectToken,
      getToken: async () => {
        await this.getTokens(stateSpools.currentSpoolId);
        const oldSubbedToChannels = subbedToChannels;
        this.unsubFromUser();
        this.unsubFromThreads();
        subbedToChannels = oldSubbedToChannels;
        subbedToChannels.forEach((chan) => {
          if (chan.startsWith('user')) {
            this.subToUser();
            return;
          }
          this.subToThread(Number(chan.split('#')[1]));
        }, this);
        return tokens!.ConnectToken;
      }
    });

    centrifuge.on('error', (err) => console.log(`Centrifuge Error: ${JSON.stringify(err)}`));

    centrifuge.connect();
  },

  disconnect(): void {
    if (!centrifuge) {
      throw Error('not connected');
    }

    centrifuge.disconnect();

    centrifuge = undefined;
    tokens = undefined;
    subbedToChannels = [];

    idToThreadHandlers = {};
    userHandlers = {};
  },

  async getTokens(spool_id?: number): Promise<void> {
    const fetchedTokens = await ThreadApi.getCentrifugeTokens({ spool_id });
    if (!tokens) {
      tokens = fetchedTokens;
      return;
    }
    tokens.ChannelTokens = { ...tokens.ChannelTokens, ...fetchedTokens.ChannelTokens };
  },

  addToken(channel: string, token: string): void {
    if (!tokens) {
      throw Error('no tokens');
    }

    tokens.ChannelTokens[channel] = token;
  },

  subToThread(thread_id: number): void {
    if (!centrifuge) {
      throw Error('not connected');
    }

    if (!tokens) {
      throw Error('no tokens');
    }

    const channelToken = Object.entries(tokens.ChannelTokens).find(
      ([channel]) => channel == `thread#${thread_id}`
    );

    if (!channelToken) {
      throw Error('thread token not found');
    }

    const [channel, token] = channelToken;

    const sub = centrifuge.newSubscription(channel, { token });

    sub.on('publication', (ctx) => {
      routeThreadPublication(thread_id, ctx);
    });

    sub.subscribe();

    idToThreadHandlers[thread_id] ||= {};

    subbedToChannels.push(`thread#${thread_id}`);
  },

  unsubFromThreads(): void {
    if (!centrifuge) {
      throw Error('not connected');
    }

    if (!tokens) {
      throw Error('no tokens');
    }

    subbedToChannels.forEach((chan) => {
      if (chan.startsWith('user')) return;
      const sub = centrifuge!.getSubscription(chan)!;
      sub.unsubscribe();
      sub.removeAllListeners();
      centrifuge!.removeSubscription(sub);
    }, this);

    subbedToChannels = subbedToChannels.filter((channel) => !channel.startsWith('thread'));
  },

  onThread<T extends keyof ThreadHandlers>(
    thread_id: number,
    event: T,
    handler: ThreadHandlers[T]
  ) {
    if (!(thread_id in idToThreadHandlers)) {
      throw Error(`not subscribed to thread id: ${thread_id}`);
    }
    if (idToThreadHandlers[thread_id][event]) {
      throw new Error(`event "${event}" already bound`);
    }
    idToThreadHandlers[thread_id][event] = handler;
  },

  clearThread(thread_id: number, event: keyof ThreadHandlers) {
    if (!(thread_id in idToThreadHandlers)) {
      throw Error(`not subscribed to thread id: ${thread_id}`);
    }
    delete idToThreadHandlers[thread_id][event];
  },

  subToUser(): void {
    if (!centrifuge) {
      throw Error('not connected');
    }

    if (!tokens) {
      throw Error('no tokens');
    }

    const channelToken = Object.entries(tokens.ChannelTokens).find(([channel]) =>
      channel.startsWith('user')
    );

    if (!channelToken) {
      throw Error('user token not found');
    }

    const [channel, token] = channelToken;

    const sub = centrifuge.newSubscription(channel, { token });

    sub.on('publication', (ctx) => {
      routeUserPublication(ctx);
    });

    sub.subscribe();

    subbedToChannels.push(channel);
  },

  unsubFromUser(): void {
    if (!centrifuge) {
      throw Error('not connected');
    }

    if (!tokens) {
      throw Error('no tokens');
    }

    const userChannel = subbedToChannels.find((channel) => channel.startsWith('user'));
    if (!userChannel) return;

    const sub = centrifuge.getSubscription(userChannel)!;

    sub.unsubscribe();
    sub.removeAllListeners();
    centrifuge.removeSubscription(sub);

    subbedToChannels = subbedToChannels.filter((channel) => !channel.startsWith('user'));
  },

  onUser<T extends keyof UserHandlers>(event: T, handler: UserHandlers[T]) {
    if (userHandlers[event]) {
      throw new Error(`event "${event}" already bound`);
    }
    userHandlers[event] = handler;
  },

  clearUser(event: keyof UserHandlers) {
    delete userHandlers[event];
  }
};
