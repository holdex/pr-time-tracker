import { json, redirect } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

import { cookieNames, serializeCookie } from '$lib/server/cookie';
import { refreshUserToken } from '$lib/server/github';

export const GET: RequestHandler = async ({ cookies }) => {
  let accessToken = cookies.get(cookieNames.accessTokenCookieName);
  let refreshToken = cookies.get(cookieNames.refreshTokenCookieName);

  if (accessToken && accessToken !== 'undefined') {
    return json({ accessToken, refreshToken }, { status: 200 });
  } else if (refreshToken && refreshToken !== 'undefined') {
    const { authentication } = await refreshUserToken(refreshToken);
    accessToken = authentication.token;
    refreshToken = authentication.refreshToken;

    cookies.set(
      cookieNames.accessTokenCookieName,
      accessToken || '',
      serializeCookie({
        expires: new Date(authentication.expiresAt)
      })
    );
    cookies.set(
      cookieNames.refreshTokenCookieName,
      refreshToken || '',
      serializeCookie({
        expires: new Date(authentication.refreshTokenExpiresAt)
      })
    );
    return json({ accessToken: accessToken, refreshToken }, { status: 200 });
  } else {
    throw redirect(307, '/');
  }
};
