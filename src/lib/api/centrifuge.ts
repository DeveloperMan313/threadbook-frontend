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
  onMessageCreated: WsMsgHandler<WsMessageCreated>;
  onMessageUpdated: WsMsgHandler<WsMessageUpdated>;
  onMessageDeleted: WsMsgHandler<WsMessageDeleted>;
}

const typeToThreadHandler: Record<string, keyof ThreadHandlers> = {
  'message.created': 'onMessageCreated',
  'message.updated': 'onMessageUpdated',
  'message.deleted': 'onMessageDeleted'
};

const routeThreadPublication = (ctx: PublicationContext, handlers: ThreadHandlers) => {
  const type = ctx.data.type;
  if (!(type in typeToThreadHandler)) {
    throw Error(`unknown message type: ${type}`);
  }
  const handlerKey = typeToThreadHandler[type];
  handlers[handlerKey](ctx.data.payload);
};

interface UserHandlers {
  onThreadCreated: WsMsgHandler<WsThreadCreated>;
  onThreadUpdated: WsMsgHandler<WsThreadUpdated>;
  onThreadClosed: WsMsgHandler<WsThreadClosed>;
  onThreadInvited: WsMsgHandler<WsThreadInvited>;
  onSpoolUpdated: WsMsgHandler<WsSpoolUpdated>;
  onSpoolDeleted: WsMsgHandler<WsSpoolDeleted>;
  onSpoolInvited: WsMsgHandler<WsSpoolInvited>;
}

const typeToUserHandler: Record<string, keyof UserHandlers> = {
  'thread.created': 'onThreadCreated',
  'thread.updated': 'onThreadUpdated',
  'thread.deleted': 'onThreadClosed',
  'thread.invited': 'onThreadInvited',
  'spool.updated': 'onSpoolUpdated',
  'spool.deleted': 'onSpoolDeleted',
  'spool.invited': 'onSpoolInvited'
};

const routeUserPublication = (ctx: PublicationContext, handlers: UserHandlers) => {
  const type = ctx.data.type;
  if (!(type in typeToUserHandler)) {
    throw Error(`unknown message type: ${type}`);
  }
  const handlerKey = typeToUserHandler[type];
  handlers[handlerKey](ctx.data.payload);
};

export class CentrifugeClient {
  private centrifuge: Centrifuge | null = null;
  private tokens: GetCentrifugeTokensResponse | null = null;
  private userChannel: string | null = null;

  public async connect(): Promise<void> {
    this.tokens = await ThreadApi.getCentrifugeTokens({});

    this.centrifuge = new Centrifuge(PUBLIC_CENTRIFUGE_ORIGIN, {
      token: this.tokens.ConnectToken
    });

    this.centrifuge.on('connected', (ctx) => console.log(`Centrifuge Connected: ${ctx.client}`));
    this.centrifuge.on('disconnected', (ctx) =>
      console.log(`Centrifuge Disconnected: ${ctx.reason}`)
    );
    this.centrifuge.on('error', (err) => console.log(`Centrifuge Error: ${JSON.stringify(err)}`));

    this.centrifuge.connect();
  }

  public disconnect(): void {
    if (!this.centrifuge) {
      throw Error('not connected');
    }

    this.centrifuge.disconnect();
  }

  public async getSpoolTokens(spool_id: number): Promise<void> {
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

  public subToThread(thread_id: number, handlers: ThreadHandlers): void {
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
      routeThreadPublication(ctx, handlers);
    });

    sub.subscribe();
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

  public subToUser(handlers: UserHandlers): void {
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
      routeUserPublication(ctx, handlers);
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
}
