import { redirect } from '@sveltejs/kit';

import { dev } from '$app/environment';

import type { LayoutServerLoad } from './$types';

import { routes } from '$lib/config';
import { REDIRECT_TEMP } from '$lib/constants';

import { UserRole } from '$lib/@types';

export const load: LayoutServerLoad = async ({ parent }) => {
  const data = await parent();

  if (data.user?.role === UserRole.MANAGER) return data;

  throw redirect(REDIRECT_TEMP, routes.prs.path);
};
