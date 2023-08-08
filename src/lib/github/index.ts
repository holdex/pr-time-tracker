import { getWebFlowAuthorizationUrl } from '@octokit/oauth-methods';

import config from '$lib/config';

export function genAuthUrl() {
  return getWebFlowAuthorizationUrl({
    clientId: config.github.clientId,
    clientType: 'github-app',
    redirectUrl: config.github.authorizeRedirectUrl
  }).url;
}
