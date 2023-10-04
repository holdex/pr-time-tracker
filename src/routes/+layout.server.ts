import { redirect } from '@sveltejs/kit';

import { dev } from '$app/environment';

import type { LayoutServerLoad } from './$types';
import type { ContributorSchema } from '$lib/@types';

import { invalidations, routes } from '$lib/config';
import type { User } from '$lib/server/github';
import { REDIRECT_TEMP } from '$lib/constants';
import { contributors } from '$lib/server/mongo/collections';
import { cookieNames } from '$lib/server/cookie';

export const load: LayoutServerLoad = async ({ fetch, depends, url, cookies }) => {
  depends(invalidations.user);

  const data: { user: User | null } = await fetch('/api/github/auth/profile').then((res) =>
    res.json()
  );
  let user: (User & Omit<ContributorSchema, '_id'> & { _id?: string }) | null = null;

  if (data.user) {
    const { _id, ...contributor } = (await contributors.getOne({ id: data.user.id }))! || {};

    user = { ...data.user, ...contributor, _id: _id?.toString() };
    if (dev) user.role = 'Manager' as any;
    data.user = user;
    cookies.set(cookieNames.role, user.role);
  }

  if (!user && !url.pathname.includes(routes.login.path)) {
    throw redirect(REDIRECT_TEMP, routes.login.path);
  } else if (user && url.pathname.includes(routes.login.path)) {
    throw redirect(REDIRECT_TEMP, dev ? routes.prs.path : routes.contributors.path);
  }

  return data as { user: (User & ContributorSchema) | null };
};
