import type { LayoutLoad } from './$types';
import { ApiClient } from '$lib/api/client';
import { initLocale } from '$lib/states';

export const load: LayoutLoad = async ({ fetch }) => {
  ApiClient.setFetch(fetch);
  initLocale();
};

export const ssr = false;
