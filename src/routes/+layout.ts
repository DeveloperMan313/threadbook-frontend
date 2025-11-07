import type { LayoutLoad } from './$types';
import { ApiClient } from '$lib/api/client';

export const load: LayoutLoad = async ({ fetch }) => {
  ApiClient.setFetch(fetch);
};

export const ssr = false;
