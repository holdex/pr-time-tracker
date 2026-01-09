import type { PageServerLoad } from './$types';

import { UserRole } from '$lib/@types';

export const load: PageServerLoad = async ({ parent }) => {
  const data = await parent();
  const isManager = data.user?.role === UserRole.MANAGER;

  return {
    ...data,
    isManager
  };
};
