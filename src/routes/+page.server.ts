import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

import { routes } from '$lib/config';
import { REDIRECT_TEMP } from '$lib/constants';

export const load: LayoutServerLoad = async () => {
  throw redirect(REDIRECT_TEMP, routes.contributors.path);
};
