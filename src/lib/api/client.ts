import { PUBLIC_API_ORIGIN } from '$env/static/public';

/**
 * Base API client that sends JSON, cookies and works with CORS
 */
export const ApiClient = {
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

    const response = await fetch(PUBLIC_API_ORIGIN + inputRelative, init);

    if (response.status >= 500) {
      alert('Service unavailable');
    }

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
