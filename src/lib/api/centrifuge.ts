import { Centrifuge, type PublicationContext } from 'centrifuge';
import { ThreadApi } from './thread';
import { PUBLIC_CENTRIFUGE_ORIGIN } from '$env/static/public';
import type { GetCentrifugeTokensResponse, WsMessageCreated } from '$lib/types';

type WsMsgHandler<T> = (payload: T) => void;

const routeThreadPublication = (
  ctx: PublicationContext,
  onMessageCreated: WsMsgHandler<WsMessageCreated>
) => {
  switch (ctx.data.type) {
    case 'message.created':
      onMessageCreated(ctx.data.payload);
      break;
    default:
      throw Error(`unknown message type: ${ctx.data.type}`);
  }
};

const routeUserPublication = (ctx: PublicationContext) => {
  switch (ctx.data.type) {
    default:
      throw Error(`unknown message type: ${ctx.data.type}`);
  }
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

  public async getSpoolTokens(spool_id: number): Promise<void> {
    this.tokens = await ThreadApi.getCentrifugeTokens({ spool_id });
  }

  public subToThread(thread_id: number, onMessageCreated: MessageHandler): void {
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
      routeThreadPublication(ctx, onMessageCreated);
    });

    sub.subscribe();
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

    sub.removeAllListeners('publication');
  }
}
