import { Centrifuge, type PublicationContext } from 'centrifuge';
import { ThreadApi } from './thread';
import { PUBLIC_CENTRIFUGE_ORIGIN } from '$env/static/public';
import type { GetCentrifugeTokensResponse, WsMessageSent } from '$lib/types';

type MessageHandler = (message: WsMessageSent) => void;

const routeThreadPublication = (ctx: PublicationContext, onMessage: MessageHandler) => {
  switch (ctx.data.type) {
    case 'message.created':
      onMessage(ctx.data);
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

  public async subToThread(thread_id: number, onMessage: MessageHandler): Promise<void> {
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
      routeThreadPublication(ctx, onMessage);
    });

    sub.subscribe();
  }

  public async subToUser(): Promise<void> {
    if (!this.centrifuge || !this.tokens) {
      throw Error('not connected');
    }

    const [channel, token] = Object.entries(this.tokens.ChannelTokens).find(([channel]) =>
      channel.startsWith('user')
    ) as [string, string];
    const sub = this.centrifuge.newSubscription(channel, { token });

    sub.on('publication', (ctx) => {
      routeUserPublication(ctx);
    });

    sub.subscribe();
  }
}
