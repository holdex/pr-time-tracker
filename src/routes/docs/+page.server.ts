import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

import { routes } from '$lib/config';
import { REDIRECT_TEMP } from '$lib/constants';

export const load: PageServerLoad = async () => {
  // temporary redirect until there are more docs
  throw redirect(REDIRECT_TEMP, routes.docsCommands.path);
};
