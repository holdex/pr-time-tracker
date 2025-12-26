import type { HandleClientError } from '@sveltejs/kit';

import { isDev } from '$lib/config';
import rollbar from '$lib/rollbar';

export const handleError: HandleClientError = async ({ error, event }) => {
  if (!isDev) {
    rollbar.error(error as string, event);
  }

  return {
    message: 'An internal client error occurred'
  };
};
