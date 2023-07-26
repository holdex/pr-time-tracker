import { App } from 'octokit'
import config from '$lib/server/config'
import type { PullRequestEvent, IssuesEvent, PullRequestReviewEvent } from '@octokit/webhooks-types'

const app = new App({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
    webhooks: {
        secret: config.webhookSecret
    }
})

export type { PullRequestEvent, IssuesEvent, PullRequestReviewEvent }
export default app