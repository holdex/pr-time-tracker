import { json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

import { cookieNames, serializeCookie } from '$lib/server/cookie';
import { logout } from '$lib/server/github';

export const GET: RequestHandler = async ({ cookies }) => {
  const accessToken = cookies.get(cookieNames.accessTokenCookieName);

  if (accessToken) await logout(accessToken);

  cookies.getAll().map(({ name }) => {
    cookies.delete(
      name,
      serializeCookie({
        expires: new Date(0)
      })
    );
  });

  return json({}, { status: 200 });
};
