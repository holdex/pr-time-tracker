import { PUB_GITHUB_CLIENT_ID } from '$env/static/public';
import { dev } from '$app/environment';

type Config = {
  github: {
    baseUrl: string;
    apiUrl: string;
    clientId: string;
    authorizeRedirectUrl: string;
  };
};

const config: Config = {
  github: {
    baseUrl: 'https://github.com',
    apiUrl: 'https://api.github.com',
    clientId: PUB_GITHUB_CLIENT_ID,
    authorizeRedirectUrl: dev
      ? `https://alert-seemingly-moccasin.ngrok-free.app/api/github/auth/authorize`
      : ''
  }
};

export const invalidations = {
  user: 'custom:user'
};

export const isDev = dev;
export default config;
