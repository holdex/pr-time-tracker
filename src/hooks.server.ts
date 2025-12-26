import type { HandleServerError } from '@sveltejs/kit';

import { isDev } from '$lib/config';
import rollbar from '$lib/server/rollbar';

export const handleError: HandleServerError = async ({ error, event }) => {
  const headers: Record<string, string> = {};
  event.request.headers.forEach((v: string, k: string) => (headers[k] = v));

  if (!isDev) {
    rollbar.error(error as string, {
      headers: headers,
      url: event.url,
      method: event.request.method
    });
  }

  return {
    message: 'An internal server error occurred'
  };
};
