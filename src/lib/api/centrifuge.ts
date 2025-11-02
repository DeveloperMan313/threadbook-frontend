import { Centrifuge, type PublicationContext } from 'centrifuge';
import { ThreadApi } from './thread';
import { PUBLIC_CENTRIFUGE_ORIGIN } from '$env/static/public';
import type { GetCentrifugeTokensResponse, WsMessageSent } from '$lib/types';

type MessageHandler = (message: WsMessageSent) => void;

const routeUserPublication = (ctx: PublicationContext, onMessage: MessageHandler) => {
  switch (
  'sent' as string // TODO ctx.data.type as string
  ) {
    case 'sent':
      onMessage(ctx.data);
      break;
    default:
      throw Error(`unknown message type: ${ctx.data.type}`);
  }
};

export class CentrifugeClient {
  private centrifuge: Centrifuge | null = null;
  private tokens: GetCentrifugeTokensResponse | null = null;

  public async connect(spool_id: number): Promise<void> {
    this.tokens = await ThreadApi.getCentrifugeTokens({ spool_id });

    this.centrifuge = new Centrifuge(PUBLIC_CENTRIFUGE_ORIGIN, {
      token: this.tokens.ConnectToken
    });

    this.centrifuge.on('connected', (ctx) => console.log(`Centrifuge Connected: ${ctx.client}`));
    this.centrifuge.on('disconnected', (ctx) => console.log(`Centrifuge Disconnected: ${ctx.reason}`));
    this.centrifuge.on('error', (err) => console.log(`Centrifuge Error: ${JSON.stringify(err)}`));

    this.centrifuge.connect();
  }

  public async subToUser(onMessage: MessageHandler): Promise<void> {
    if (!this.centrifuge || !this.tokens) {
      throw Error('not connected');
    }

    const [channel, token] = Object.entries(this.tokens.ChannelTokens).find(([channel]) =>
      channel.startsWith('user')
    ) as [string, string];
    const sub = this.centrifuge.newSubscription(channel, { token });

    sub.on('publication', (ctx) => {
      routeUserPublication(ctx, onMessage);
    });

    sub.subscribe();
  }
};
