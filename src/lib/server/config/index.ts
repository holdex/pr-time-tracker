import {
  MONGODB_URI,
  WEBHOOK_SECRET,
  GITHUB_APP_ID,
  GITHUB_PRIVATE_KEY,
  GITHUB_CLIENT_SECRET
} from '$env/static/private';

type Config = {
  mongoDBUri: string;
  mongoDBName: string;
  webhookSecret: string;
  github: {
    appId: string;
    clientSecret: string;
    privateKey: string;
  };
};

const config: Config = {
  webhookSecret: WEBHOOK_SECRET,
  mongoDBUri: MONGODB_URI,
  mongoDBName: 'data',
  github: {
    appId: GITHUB_APP_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    privateKey: GITHUB_PRIVATE_KEY
  }
};

export default config;
