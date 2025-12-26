import Rollbar from 'rollbar';

import { isDev } from '$lib/config';
import config from '$lib/server/config';

const rollbar = new Rollbar({
  accessToken: config.rollbarServerToken,
  payload: {
    environment: !isDev ? 'production' : 'development'
  }
});

export default rollbar;
