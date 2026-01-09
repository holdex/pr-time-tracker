import { error } from '@sveltejs/kit';

import { API_BASE_URL } from '$env/static/private';

import { renderMarkdown } from '$lib/utils/markdown';

function getDocsApiUrl(name: string) {
  return `${API_BASE_URL}/api/docs?name=${name}`;
}

/**
 * In-memory cache for documentation markdown and rendered HTML.
 * Cache persists only within a single warm serverless container instance.
 * TTL: 1 hour
 */
const CACHE_TTL_MS = 3600_000; // 1h

type SupportedDocs = 'MANAGER_COMMANDS' | 'COMMANDS';

const docsPromises: Map<
  SupportedDocs,
  Promise<{ markdown: string; html: string; timestamp: number }>
> = new Map();

export async function getDocs(name: SupportedDocs) {
  const now = Date.now();

  const cachedPromise = docsPromises.get(name);
  if (cachedPromise) {
    const cached = await cachedPromise;
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached;
    }
    docsPromises.delete(name);
  }

  const promise = (async () => {
    const response = await fetch(getDocsApiUrl(name), {
      headers: {
        Accept: 'text/plain'
      }
    });

    if (!response.ok) {
      throw error(response.status, `Failed to fetch documentation: ${response.statusText}`);
    }

    const markdown = await response.text();
    const html = await renderMarkdown(markdown);

    return { markdown, html, timestamp: Date.now() };
  })();
  docsPromises.set(name, promise);

  return promise;
}
