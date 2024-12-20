import { json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

import { type User, refreshUserToken } from '$lib/server/github';
import { cookieNames, serializeCookie } from '$lib/server/cookie';
import config from '$lib/config';

export const GET: RequestHandler = async ({ cookies }) => {
  let accessToken = cookies.get(cookieNames.accessTokenCookieName);
  let refreshToken = cookies.get(cookieNames.refreshTokenCookieName);

  let user: User | null = null;

  if (!accessToken) {
    if (refreshToken) {
      const { authentication } = await refreshUserToken(refreshToken);

      cookies.set(
        cookieNames.accessTokenCookieName,
        authentication.token,
        serializeCookie({
          expires: new Date(authentication.expiresAt)
        })
      );
      cookies.set(
        cookieNames.refreshTokenCookieName,
        authentication.refreshToken,
        serializeCookie({
          expires: new Date(authentication.refreshTokenExpiresAt)
        })
      );

      accessToken = authentication.token;
      refreshToken = authentication.refreshToken;
    } else {
      return json({ user }, { status: 200 });
    }
  }

  await fetch(config.github.apiUrl + '/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then((r) => r.json())
    .then((r) => (user = r));

  return json({ user }, { status: 200 });
};
