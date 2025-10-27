import { Centrifuge, type PublicationContext } from 'centrifuge';
import { ThreadApi } from './thread';
import { PUBLIC_CENTRIFUGE_ORIGIN } from '$env/static/public';
import type { GetCentrifugeTokensResponse, WsMessageSent } from '$lib/types';

let centrifuge: Centrifuge;
let tokens: GetCentrifugeTokensResponse;

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

export const CentrifugeClient = {
  connect: async () => {
    if (centrifuge) {
      throw Error('already connected');
    }

    tokens = await ThreadApi.getCentrifugeTokens();

    centrifuge = new Centrifuge(PUBLIC_CENTRIFUGE_ORIGIN, {
      token: tokens.ConnectToken
    });

    centrifuge.on('connected', (ctx) => console.log(`Centrifuge Connected: ${ctx.client}`));
    centrifuge.on('disconnected', (ctx) => console.log(`Centrifuge Disconnected: ${ctx.reason}`));
    centrifuge.on('error', (err) => console.log(`Centrifuge Error: ${JSON.stringify(err)}`));

    centrifuge.connect();
  },

  subToUser: async (onMessage: MessageHandler) => {
    if (!centrifuge) {
      throw Error('not connected');
    }

    const [channel, token] = Object.entries(tokens.ChannelTokens).find(([channel]) =>
      channel.startsWith('user')
    ) as [string, string];
    const sub = centrifuge.newSubscription(channel, { token });

    sub.on('publication', (ctx) => {
      routeUserPublication(ctx, onMessage);
    });

    sub.subscribe();
  }
};
