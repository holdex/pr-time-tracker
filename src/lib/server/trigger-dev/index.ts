import { TriggerClient } from '@trigger.dev/sdk';

import config from '../config';

export const client = new TriggerClient({
  id: 'autoinvoicing-hCPJ',
  apiKey: config.triggerDev.apiKey,
  apiUrl: config.triggerDev.apiUrl
});
