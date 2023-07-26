import { App } from 'octokit'
import config from '$lib/server/config'

const app = new App({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
    webhooks: {
        secret: config.webhookSecret
    }
})

export default app