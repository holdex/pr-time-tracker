import { error, redirect, type HttpError } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

import { INTERNAL_SERVER_ERROR, REDIRECT_TEMP } from '$lib/constants';
import { routes } from '$lib/config';

import { getDocs } from '../../utils';

import { UserRole } from '$lib/@types';

export const load: PageServerLoad = async ({ parent }) => {
  const data = await parent();

  const test = false;
  if (data.user?.role !== UserRole.MANAGER && test) {
    throw redirect(REDIRECT_TEMP, routes.docsCommands.path);
  }

  try {
    const { html } = await getDocs('MANAGER_COMMANDS');
    const title = 'Manager Commands';

    return {
      ...data,
      content: html,
      title
    };
  } catch (err) {
    const httpError = err as HttpError;
    console.error(err);
    if (httpError.status) {
      throw httpError;
    }

    throw error(
      INTERNAL_SERVER_ERROR,
      `Failed to load manager commands documentation: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`
    );
  }
};
