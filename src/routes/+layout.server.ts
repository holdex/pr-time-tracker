import { redirect } from '@sveltejs/kit';

import { dev } from '$app/environment';

import type { LayoutServerLoad } from './$types';
import type { ContributorSchema } from '$lib/@types';

import { invalidations, routes } from '$lib/config';
import type { User } from '$lib/server/github';
import { REDIRECT_TEMP } from '$lib/constants';
import { contributors } from '$lib/server/mongo/collections';
import { cookieNames, serializeCookie } from '$lib/server/cookie';

export const load: LayoutServerLoad = async ({ fetch, depends, url, cookies }) => {
  depends(invalidations.user);

  const data: { user: User | null } = await fetch('/api/github/auth/profile').then((res) =>
    res.json()
  );
  let user: (User & Omit<ContributorSchema, '_id'> & { _id?: string }) | null = null;

  if (data && data.user && data.user.id) {
    const contributor =
      (await contributors.getOneOrCreate({
        id: data.user.id,
        login: data.user.login,
        name: data.user.name,
        url: data.user.url,
        role: 'Contributor',
        rate: 1,
        avatarUrl: data.user.avatar_url
      }))! || {};
    user = { ...data.user, ...contributor, _id: contributor._id?.toString() };
    data.user = user;
    cookies.set(cookieNames.contributorId, user.id.toString(), serializeCookie());
    cookies.set(cookieNames.contributorRole, user.role, serializeCookie());
  }

  if (!user && !url.pathname.includes(routes.login.path)) {
    throw redirect(REDIRECT_TEMP, routes.login.path);
  } else if (user && url.pathname.includes(routes.login.path)) {
    throw redirect(REDIRECT_TEMP, dev ? routes.prs.path : routes.contributors.path);
  }

  return data as { user: (User & ContributorSchema) | null };
};
