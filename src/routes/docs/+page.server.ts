import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

import { routes } from '$lib/config';
import { REDIRECT_TEMP } from '$lib/constants';

import { UserRole } from '$lib/@types';

export const load: PageServerLoad = async ({ parent }) => {
  const data = await parent();

  console.log(data.user?.role, data.user?.login);
  if (data.user?.role === UserRole.MANAGER || data.user?.login === 'teodorus-nathaniel') {
    throw redirect(REDIRECT_TEMP, routes.managerCommandsDocs.path);
  }

  throw redirect(REDIRECT_TEMP, routes.prs.path);
};
