import { sequence } from '@sveltejs/kit/hooks';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

import { isDev } from '$lib/config';

Sentry.init({
  enabled: !isDev,
  dsn: 'https://52551ee6b0eec4cb55371599d3e77a1f@o4507062375481344.ingest.us.sentry.io/4507062377512960',
  tracesSampleRate: 1.0

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: import.meta.env.DEV,
});

// If you have custom handlers, make sure to place them after `sentryHandle()` in the `sequence` function.
export const handle = sequence(sentryHandle());

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
