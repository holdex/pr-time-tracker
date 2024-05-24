import { TriggerClient } from '@trigger.dev/sdk';
import { Autoinvoicing, events } from '@holdex/autoinvoicing';
import { REST } from '@discordjs/rest';
import { API } from '@discordjs/core';

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

const rest = new REST({ version: '10' }).setToken(config.discord.botToken);
const discordApi = new API(rest);

export type { Autoinvoicing };
export { events, github, client, discordApi };
