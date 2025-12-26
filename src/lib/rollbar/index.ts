import Rollbar from 'rollbar';

import config, { isDev } from '$lib/config';

const codeVersion = import.meta.env.VITE_LATEST_SHA || '1.0.0';

const rollbar = new Rollbar({
  accessToken: config.rollbarClientToken,
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    environment: !isDev ? 'production' : 'development',
    client: {
      javascript: {
        code_version: codeVersion,
        source_map_enabled: true,
        guess_uncaught_frames: true
      }
    }
  }
});

export default rollbar;
