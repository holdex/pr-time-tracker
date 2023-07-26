import { App } from 'octokit'
import config from '$lib/server/config'
import { default as clientConfig } from '$lib/config'
import type { PullRequestEvent, IssuesEvent, PullRequestReviewEvent, InstallationEvent } from '@octokit/webhooks-types'

const app = new App({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
    oauth: {
        clientId: clientConfig.github.clientId,
        clientSecret: config.github.clientSecret
    },
    webhooks: {
        secret: config.webhookSecret
    }
})

export type { PullRequestEvent, IssuesEvent, PullRequestReviewEvent, InstallationEvent }
export default app