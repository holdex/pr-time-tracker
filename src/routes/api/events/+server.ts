import { json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

import { jsonError } from '$lib/utils';
import { getEvents } from '$lib/server/gcloud';

export const GET: RequestHandler = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await getEvents();
    return json(rows);
  } catch (e: any) {
    return jsonError(e, '/api/events');
  }
};
