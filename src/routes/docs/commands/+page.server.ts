import { error, type HttpError } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

import { INTERNAL_SERVER_ERROR } from '$lib/constants';
import { getDocs } from '$routes/docs/utils';

export const load: PageServerLoad = async ({ parent }) => {
  const data = await parent();

  try {
    const { html } = await getDocs('COMMANDS');
    const title = 'User Commands';

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
      `Failed to load user commands documentation: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`
    );
  }
};
