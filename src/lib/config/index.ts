import {
  PUB_GITHUB_CLIENT_ID,
  PUB_SUBMISSION_DURATION,
  PUB_ROLLBAR_POST_CLIENT_ITEM_ACCESS_TOKEN
} from '$env/static/public';
import { dev } from '$app/environment';

type Config = {
  github: {
    baseUrl: string;
    apiUrl: string;
    clientId: string;
    authorizeRedirectUrl: string;
  };
  rollbarClientToken: string;
  submissionDuration: string;
};

const config: Config = {
  github: {
    baseUrl: 'https://github.com',
    apiUrl: 'https://api.github.com',
    clientId: PUB_GITHUB_CLIENT_ID,
    authorizeRedirectUrl: dev
      ? `https://alert-seemingly-moccasin.ngrok-free.app/api/github/auth/authorize`
      : ''
  },
  rollbarClientToken: PUB_ROLLBAR_POST_CLIENT_ITEM_ACCESS_TOKEN,
  submissionDuration: PUB_SUBMISSION_DURATION
};

export const invalidations = {
  user: 'custom:user'
};

interface Route {
  path: string;
  title: string;
}

export const routes: Record<
  'contributors' | 'index' | 'login' | 'prs' | 'prsArchive' | 'managerCommandsDocs',
  Route
> = {
  contributors: {
    path: '/contributors',
    title: 'Contributors'
  },
  index: { path: '/', title: 'Autoinvoicing' },
  login: { path: '/login', title: 'Login' },
  prs: {
    path: '/prs',
    title: 'Your Closed Pull Requests'
  },
  prsArchive: {
    path: '/prs/archive',
    title: 'Your Closed Pull Requests Archive'
  },
  managerCommandsDocs: {
    path: '/docs/commands/manager',
    title: 'Manager Commands Documentation'
  }
};

export const responseHeadersInit = {
  'content-type': 'application/json; charset=utf-8',
  accept: 'application/json',
  'Cache-Control': 'max-age=300, s-maxage=300, stale-if-error=120'
};

export const isDev = dev;

export default config;
