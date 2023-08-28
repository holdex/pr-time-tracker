import { App } from 'octokit';
import oauthMethods from '@octokit/oauth-methods';

import type {
  PullRequestEvent,
  IssuesEvent,
  PullRequestReviewEvent,
  PullRequestReviewCommentEvent,
  InstallationEvent,
  User,
  PullRequest,
  SimplePullRequest,
  Organization,
  Repository
} from '@octokit/webhooks-types';

import config from '$lib/server/config';
import { default as clientConfig } from '$lib/config';

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

type GitHubAppAuthenticationWithRefreshToken = oauthMethods.GitHubAppAuthenticationWithRefreshToken;
export type {
  PullRequestEvent,
  IssuesEvent,
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
