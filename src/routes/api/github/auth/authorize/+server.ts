import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

import {
  exchangeWebFlowCode,
  type GitHubAppAuthenticationWithRefreshToken
} from '$lib/server/github';
import { names, serializeCookie } from '$lib/server/cookie';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code') as string;

  const response = await exchangeWebFlowCode(code).catch((err) => {
    throw redirect(302, `/?error=${JSON.stringify(err)}`);
  });

  const authentication = response.authentication as GitHubAppAuthenticationWithRefreshToken;
  cookies.set(
    names.accessTokenCookieName,
    authentication.token,
    serializeCookie({
      expires: new Date(authentication.expiresAt)
    })
  );
  cookies.set(
    names.refreshTokenCookieName,
    authentication.refreshToken,
    serializeCookie({
      expires: new Date(authentication.refreshTokenExpiresAt)
    })
  );
  throw redirect(302, '/');
};
