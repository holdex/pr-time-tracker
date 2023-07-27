import { App } from 'octokit'
import config from '$lib/server/config'
import { default as clientConfig } from '$lib/config'
import oauthMethods from '@octokit/oauth-methods'
import type { PullRequestEvent, IssuesEvent, PullRequestReviewEvent, InstallationEvent, User } from '@octokit/webhooks-types'

const app = new App({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
    webhooks: {
        secret: config.webhookSecret
    }
})

export async function exchangeWebFlowCode(code: string) {
    return oauthMethods.exchangeWebFlowCode({
        clientType: "github-app",
        clientId: clientConfig.github.clientId,
        clientSecret: config.github.clientSecret,
        code,
    })
}

type GitHubAppAuthenticationWithRefreshToken = oauthMethods.GitHubAppAuthenticationWithRefreshToken
export type { PullRequestEvent, IssuesEvent, PullRequestReviewEvent, InstallationEvent, GitHubAppAuthenticationWithRefreshToken, User }
export default app