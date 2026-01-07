import { error, redirect, type HttpError } from '@sveltejs/kit';

import { API_BASE_URL } from '$env/static/private';

import type { PageServerLoad } from './$types';

import { INTERNAL_SERVER_ERROR, REDIRECT_TEMP } from '$lib/constants';
import { renderMarkdown } from '$lib/utils/markdown';
import { routes } from '$lib/config';

import { UserRole } from '$lib/@types';

const DOCS_API_URL = `${API_BASE_URL}/api/docs?name=MANAGER_COMMANDS`;

export const load: PageServerLoad = async ({ parent, fetch }) => {
  const data = await parent();

  if (data.user?.role !== UserRole.MANAGER) {
    throw redirect(REDIRECT_TEMP, routes.prs.path);
  }

  try {
    const response = await fetch(DOCS_API_URL, {
      headers: {
        Accept: 'text/plain'
      }
    });

    if (!response.ok) {
      throw error(response.status, `Failed to fetch documentation: ${response.statusText}`);
    }

    const markdown = await response.text();
    const title = 'Manager Commands';

    const html = await renderMarkdown(markdown);

    return {
      ...data,
      content: html,
      title
    };
  } catch (err) {
    const httpError = err as HttpError;
    if (httpError.status) {
      throw httpError;
    }

    throw error(
      INTERNAL_SERVER_ERROR,
      `Failed to load documentation: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
};
