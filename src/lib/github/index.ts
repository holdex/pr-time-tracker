import config from '$lib/config'
import { getWebFlowAuthorizationUrl } from '@octokit/oauth-methods'


export function genAuthUrl() {
    return getWebFlowAuthorizationUrl({
        clientId: config.github.clientId,
        clientType: "github-app",
        redirectUrl: config.github.authorizeRedirectUrl
    }).url
};