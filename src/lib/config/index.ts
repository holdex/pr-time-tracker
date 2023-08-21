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

interface Route {
  path: string;
  title: string;
}

export const routes: Record<'contributors' | 'index' | 'login' | 'prs' | 'prsArchive', Route> = {
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
  }
};

export const ResponseHeadersInit = {
  'content-type': 'application/json; charset=utf-8',
  accept: 'application/json',
  'Cache-Control': 'max-age=300, s-maxage=300, stale-if-error=120'
};

export const isDev = dev;
export default config;
