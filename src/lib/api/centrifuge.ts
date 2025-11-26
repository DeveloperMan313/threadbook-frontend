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

type WsMsgHandler<T> = (payload: T) => void;

interface ThreadHandlers {
  'message.created'?: WsMsgHandler<WsMessageCreated>;
  'message.updated'?: WsMsgHandler<WsMessageUpdated>;
  'message.deleted'?: WsMsgHandler<WsMessageDeleted>;
}

const idToThreadHandlers: Record<number, ThreadHandlers> = {};

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

const userHandlers: UserHandlers = {};

const routeUserPublication = (ctx: PublicationContext) => {
  const type = ctx.data.type as keyof UserHandlers;
  if (!(type in userHandlers)) {
    throw Error(`unknown message type: ${type}`);
  }
  userHandlers[type]?.(ctx.data.payload);
};

class CentrifugeClient {
  private centrifuge: Centrifuge | undefined = undefined;
  private tokens: GetCentrifugeTokensResponse | undefined = undefined;
  private userChannel: string | undefined = undefined;

  public async connect(): Promise<void> {
    if (this.centrifuge) {
      return;
    }

    await this.getTokens();

    this.centrifuge = new Centrifuge(PUBLIC_CENTRIFUGE_ORIGIN, {
      token: this.tokens!.ConnectToken
    });

    this.centrifuge.on('error', (err) => console.log(`Centrifuge Error: ${JSON.stringify(err)}`));

    this.centrifuge.connect();
  }

  public disconnect(): void {
    if (!this.centrifuge) {
      throw Error('not connected');
    }

    this.centrifuge.disconnect();

    delete this.centrifuge;
  }

  public async getTokens(spool_id?: number): Promise<void> {
    const fetchedTokens = await ThreadApi.getCentrifugeTokens({ spool_id });
    if (!this.tokens) {
      this.tokens = fetchedTokens;
      return;
    }
    this.tokens.ChannelTokens = { ...this.tokens.ChannelTokens, ...fetchedTokens.ChannelTokens };
  }

  public addToken(channel: string, token: string): void {
    if (!this.tokens) {
      throw Error('no tokens');
    }

    this.tokens.ChannelTokens[channel] = token;
  }

  public subToThread(thread_id: number): void {
    if (!this.centrifuge) {
      throw Error('not connected');
    }

    if (!this.tokens) {
      throw Error('no tokens');
    }

    const channelToken = Object.entries(this.tokens.ChannelTokens).find(
      ([channel]) => channel == `thread#${thread_id}`
    ) as [string, string];

    if (!channelToken) {
      throw Error('thread token not found');
    }

    const [channel, token] = channelToken;

    const sub = this.centrifuge.newSubscription(channel, { token });

    sub.on('publication', (ctx) => {
      routeThreadPublication(thread_id, ctx);
    });

    sub.subscribe();

    idToThreadHandlers[thread_id] = {};
  }

  public unsubFromThreads(): void {
    if (!this.centrifuge) {
      throw Error('not connected');
    }

    if (!this.tokens) {
      throw Error('no tokens');
    }

    Object.entries(this.tokens.ChannelTokens).forEach(([channel]) => {
      if (channel.startsWith('user')) return;
      const sub = this.centrifuge!.getSubscription(channel);
      if (!sub) return;
      sub.unsubscribe();
      sub.removeAllListeners();
      this.centrifuge!.removeSubscription(sub);
    }, this);
  }

  public onThread<T extends keyof ThreadHandlers>(
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
  }

  public clearThread(thread_id: number, event: keyof ThreadHandlers) {
    if (!(thread_id in idToThreadHandlers)) {
      throw Error(`not subscribed to thread id: ${thread_id}`);
    }
    delete idToThreadHandlers[thread_id][event];
  }

  public subToUser(): void {
    if (!this.centrifuge) {
      throw Error('not connected');
    }

    if (!this.tokens) {
      throw Error('no tokens');
    }

    const channelToken = Object.entries(this.tokens.ChannelTokens).find(([channel]) =>
      channel.startsWith('user')
    ) as [string, string];

    if (!channelToken) {
      throw Error('user token not found');
    }

    const [channel, token] = channelToken;
    this.userChannel = channel;

    const sub = this.centrifuge.newSubscription(channel, { token });

    sub.on('publication', (ctx) => {
      routeUserPublication(ctx);
    });

    sub.subscribe();
  }

  public unsubFromUser(): void {
    if (!this.centrifuge) {
      throw Error('not connected');
    }

    if (!this.userChannel) {
      throw Error('not subscribed to user');
    }

    const sub = this.centrifuge.getSubscription(this.userChannel)!;

    sub.unsubscribe();
    sub.removeAllListeners();
    this.centrifuge.removeSubscription(sub);
  }

  public onUser<T extends keyof UserHandlers>(event: T, handler: UserHandlers[T]) {
    if (userHandlers[event]) {
      throw new Error(`event "${event}" already bound`);
    }
    userHandlers[event] = handler;
  }

  public clearUser(event: keyof UserHandlers) {
    delete userHandlers[event];
  }
}

export const centrifugeClient = new CentrifugeClient();
