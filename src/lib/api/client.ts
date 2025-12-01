import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { PUBLIC_API_ORIGIN } from '$env/static/public';

// use window.fetch by default
let svelteFetch: typeof window.fetch;

/**
 * Base API client that sends JSON, cookies and works with CORS
 */
export const ApiClient = {
  setFetch(newFetch: typeof svelteFetch) {
    svelteFetch = newFetch;
  },

  async fetch(inputRelative: string, init?: RequestInit): Promise<Response> {
    if (!init) {
      init = {};
    }
    init.mode = 'cors';
    init.credentials = 'include';
    if (!init.headers) {
      init.headers = {
        'Content-Type': 'application/json'
      };
    }

    const response = await svelteFetch(PUBLIC_API_ORIGIN + inputRelative, init);

    if (response.status == 401) {
      goto(resolve('/signin', {}));
      throw Error('unauthorized');
    }

    // turned off because i worry for epileptic people
    // if (response.status >= 500) {
    //   alert('Service unavailable');
    // }

    return response;
  },

  async fetchJSON(inputRelative: string, init?: RequestInit) {
    const response = await ApiClient.fetch(inputRelative, init);
    const json = await response.json();
    if (!response.ok) {
      throw Error(json.error);
    }
    return json;
  }
};
