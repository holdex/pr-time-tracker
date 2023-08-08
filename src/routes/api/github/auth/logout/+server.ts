import { json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

import { names, serializeCookie } from '$lib/server/cookie';
import { logout } from '$lib/server/github';

export const GET: RequestHandler = async ({ cookies }) => {
  const accessToken = cookies.get(names.accessTokenCookieName);
  if (accessToken) {
    await logout(accessToken);
  }
  cookies.delete(
    names.accessTokenCookieName,
    serializeCookie({
      expires: new Date(0)
    })
  );
  cookies.delete(
    names.refreshTokenCookieName,
    serializeCookie({
      expires: new Date(0)
    })
  );
  return json({}, { status: 200 });
};
