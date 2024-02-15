import { App } from 'octokit';
import oauthMethods from '@octokit/oauth-methods';

import type {
  PullRequestEvent,
  IssuesEvent,
  PullRequestReviewEvent,
  CheckRunEvent,
  CheckSuiteEvent,
  PullRequestReviewCommentEvent,
  InstallationEvent,
  User,
  PullRequest,
  SimplePullRequest,
  Organization,
  Repository
} from '@octokit/webhooks-types';
import type { Cookies } from '@sveltejs/kit';

import config from '$lib/server/config';
import { default as clientConfig } from '$lib/config';

import { cookieNames } from '../cookie';
import { contributors } from '../mongo/collections';

import { UserRole, type ContributorSchema } from '$lib/@types';

const app = new App({
  appId: config.github.appId,
  privateKey: config.github.privateKey,
  webhooks: {
    secret: config.webhookSecret
  }
});

export async function exchangeWebFlowCode(code: string) {
  return oauthMethods.exchangeWebFlowCode({
    clientType: 'github-app',
    clientId: clientConfig.github.clientId,
    clientSecret: config.github.clientSecret,
    code
  });
}

export async function logout(token: string) {
  return oauthMethods.deleteToken({
    clientType: 'github-app',
    clientId: clientConfig.github.clientId,
    clientSecret: config.github.clientSecret,
    token
  });
}

export async function refreshUserToken(token: string) {
  return oauthMethods.refreshToken({
    clientType: 'github-app',
    clientId: clientConfig.github.clientId,
    clientSecret: config.github.clientSecret,
    refreshToken: token
  });
}

export const verifyAuth = async (
  pathnameOrURL: string | URL,
  action: 'POST' | 'GET' | 'PATCH' | 'DELETE',
  cookie: Cookies,
  customCheck?: (contributor: ContributorSchema) => Promise<boolean> | boolean
) => {
  await checkAuthToken(cookie);
  await authorize(
    typeof pathnameOrURL === 'string' ? pathnameOrURL : pathnameOrURL.pathname,
    action,
    cookie,
    customCheck
  );
};

export const checkAuthToken = async (tokenOrCookie: string | Cookies) => {
  const token =
    typeof tokenOrCookie === 'string'
      ? tokenOrCookie
      : tokenOrCookie.get(cookieNames.accessTokenCookieName);

  if (!token) throw Error("You're not authenticated. Please, log in.");

  return await oauthMethods.checkToken({
    clientType: 'github-app',
    clientId: clientConfig.github.clientId,
    clientSecret: config.github.clientSecret,
    token
  });
};

export const authorize = async (
  pathname: string,
  action: 'POST' | 'GET' | 'PATCH' | 'DELETE',
  cookie: Cookies,
  customCheck?: (contributor: ContributorSchema) => Promise<boolean> | boolean
) => {
  const resource = pathname.replace('/api/', '') as
    | 'items'
    | 'submissions'
    | 'migrations'
    | 'contributors';
  const role = cookie.get(cookieNames.contributorRole) as UserRole | undefined;
  const id = cookie.get(cookieNames.contributorId) as string | undefined;
  const isManager = role === UserRole.MANAGER;
  const contributor = id && (await contributors.getOne({ id: +id }));

  try {
    if (!contributor || (customCheck && !(await customCheck(contributor)))) throw false;
    switch (resource) {
      case 'items':
        if (action !== 'GET' && !isManager) throw false;
        return true;
      case 'contributors':
        if (!isManager) throw false;
        return true;
      case 'submissions':
        return true;
      case 'migrations':
        return true;
    }
  } catch (e) {
    throw Error(
      `You are not permitted to ${
        action === 'GET' ? 'access this resource' : 'perform this action'
      }.`
    );
  }
};

type GitHubAppAuthenticationWithRefreshToken = oauthMethods.GitHubAppAuthenticationWithRefreshToken;
export type {
  PullRequestEvent,
  IssuesEvent,
  CheckRunEvent,
  CheckSuiteEvent,
  PullRequestReviewEvent,
  PullRequestReviewCommentEvent,
  InstallationEvent,
  GitHubAppAuthenticationWithRefreshToken,
  User,
  PullRequest,
  SimplePullRequest,
  Organization,
  Repository
};
export default app;
