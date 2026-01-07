import { error, redirect, type HttpError } from '@sveltejs/kit';

import { API_BASE_URL } from '$env/static/private';

import type { PageServerLoad } from './$types';

import { INTERNAL_SERVER_ERROR, REDIRECT_TEMP } from '$lib/constants';
import { renderMarkdown } from '$lib/utils/markdown';
import { routes } from '$lib/config';

import { UserRole } from '$lib/@types';

const DOCS_API_URL = `${API_BASE_URL}/api/docs?name=MANAGER_COMMANDS`;

/**
 * In-memory cache for documentation markdown and rendered HTML.
 * Cache persists only within a single warm serverless container instance.
 * TTL: 1 hour
 */
const CACHE_TTL_MS = 3600_000; // 1h

let docsPromise: Promise<{ markdown: string; html: string; timestamp: number }> | null = null;

const getDocs = async () => {
  const now = Date.now();

  if (docsPromise) {
    const cached = await docsPromise;
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return { markdown: cached.markdown, html: cached.html };
    }
    docsPromise = null;
  }

  docsPromise = (async () => {
    const response = await fetch(DOCS_API_URL, {
      headers: {
        Accept: 'text/plain'
      }
    });

    if (!response.ok) {
      throw error(response.status, `Failed to fetch documentation: ${response.statusText}`);
    }

    const markdown = await response.text();
    const html = await renderMarkdown(markdown);

    return { markdown, html, timestamp: now };
  })();

  const result = await docsPromise;
  return { markdown: result.markdown, html: result.html };
};

export const load: PageServerLoad = async ({ parent }) => {
  const data = await parent();

  if (data.user?.role !== UserRole.MANAGER) {
    throw redirect(REDIRECT_TEMP, routes.prs.path);
  }

  try {
    const { html } = await getDocs();
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
      `Failed to load documentation: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
};
