import { API_ORIGIN } from '$env/static/private';

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

    const response = await fetch(API_ORIGIN + inputRelative, init);

    if (response.status >= 500) {
      alert('Сервис временно недоступен');
    }

    return response;
  }
};
