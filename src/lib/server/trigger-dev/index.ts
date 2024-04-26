import { TriggerClient } from '@trigger.dev/sdk';
import { Autoinvoicing, events } from '@holdex/autoinvoicing';

import config from '../config';

const client = new TriggerClient({
  id: 'autoinvoicing-hCPJ',
  apiKey: config.triggerDev.apiKey,
  apiUrl: config.triggerDev.apiUrl
});

const github = new Autoinvoicing({
  id: 'github',
  token: config.github.token
});

export type { Autoinvoicing };
export { events, github, client };
