import {
  MONGODB_URI,
  WEBHOOK_SECRET,
  GITHUB_APP_ID,
  GITHUB_PRIVATE_KEY,
  GITHUB_CLIENT_SECRET,
  GITHUB_TOKEN,
  TRIGGER_API_KEY,
  TRIGGER_API_URL,
  GCLOUD_PROJECT_ID,
  GCLOUD_CLIENT_EMAIL,
  GCLOUD_DATASET,
  GCLOUD_TABLE,
  GCLOUD_PRIVATE_KEY
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
  }
};

export default config;
