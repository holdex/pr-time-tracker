import {
  MONGODB_URI,
  WEBHOOK_SECRET,
  GITHUB_APP_ID,
  GITHUB_PRIVATE_KEY,
  GITHUB_CLIENT_SECRET,
  GITHUB_TOKEN,
  TRIGGER_API_KEY,
  DISCORD_BOT_TOKEN,
  DISCORD_CHANNEL_ID,
  TRIGGER_API_URL,
  GCLOUD_PROJECT_ID,
  GCLOUD_CLIENT_EMAIL,
  GCLOUD_DATASET,
  GCLOUD_TABLE,
  GCLOUD_PRIVATE_KEY,
  APP_INTEGRATIONS_LIST
} from '$env/static/private';

type Config = {
  mongoDBUri: string;
  mongoDBName: string;
  webhookSecret: string;
  github: {
    appId: string;
    clientSecret: string;
    privateKey: string;
    token: string;
  };
  discord: {
    botToken: string;
    channelId: string;
  };
  gcloud: {
    projectId: string;
    dataset: string;
    table: string;
    clientEmail: string;
    privateKey: string;
  };
  triggerDev: {
    apiKey: string;
    apiUrl: string;
  };
  integrationsList: Array<{ id: string; name: string; nodeId: string }>;
};

const config: Config = {
  webhookSecret: WEBHOOK_SECRET,
  mongoDBUri: MONGODB_URI,
  mongoDBName: 'data',
  github: {
    appId: GITHUB_APP_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    privateKey: GITHUB_PRIVATE_KEY,
    token: GITHUB_TOKEN
  },
  discord: {
    botToken: DISCORD_BOT_TOKEN,
    channelId: DISCORD_CHANNEL_ID
  },
  gcloud: {
    projectId: GCLOUD_PROJECT_ID,
    dataset: GCLOUD_DATASET,
    table: GCLOUD_TABLE,
    clientEmail: GCLOUD_CLIENT_EMAIL,
    privateKey: GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
  },
  triggerDev: {
    apiKey: TRIGGER_API_KEY,
    apiUrl: TRIGGER_API_URL
  },
  integrationsList: JSON.parse(APP_INTEGRATIONS_LIST)
};

export default config;
