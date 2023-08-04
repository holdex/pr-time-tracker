import type { RequestHandler } from '@sveltejs/kit';
import { json, redirect } from '@sveltejs/kit';
import { names, serializeCookie } from '$lib/CookieManager';
import { refreshUserToken } from '$lib/server/github';

export const GET: RequestHandler = async ({ cookies }) => {
  let accessToken = cookies.get(names.accessTokenCookieName);
  let refreshToken = cookies.get(names.refreshTokenCookieName);

  if (accessToken && accessToken !== 'undefined') {
    return json({ accessToken, refreshToken }, { status: 200 });
  } else if (refreshToken && refreshToken !== 'undefined') {
    const { authentication } = await refreshUserToken(refreshToken);
    accessToken = authentication.token;
    refreshToken = authentication.refreshToken;

    cookies.set(
      names.accessTokenCookieName,
      accessToken,
      serializeCookie({
        expires: new Date(authentication.expiresAt)
      })
    );
    cookies.set(
      names.refreshTokenCookieName,
      refreshToken,
      serializeCookie({
        expires: new Date(authentication.refreshTokenExpiresAt)
      })
    );
    return json({ accessToken: accessToken, refreshToken }, { status: 200 });
  } else {
    throw redirect(307, '/');
  }
};
