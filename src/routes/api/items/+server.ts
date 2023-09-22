import { json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';
import type { ItemSchema } from '$lib/@types';

import { jsonError, transform } from '$lib/utils';
import { items } from '$lib/server/mongo/collections';

//   if (archived === ArchiveState.ARCHIVED) {
//     const deadline = new Date();
//     deadline.setMonth(deadline.getMonth() - ONE_MONTH);

//     filter.closedAt = { $gte: deadline.toString() };
//   }

export const GET: RequestHandler = async ({ url: { searchParams } }) => {
  try {
    return json({ data: await items.getMany(searchParams) });
  } catch (e) {
    return jsonError(e, '/api/items');
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    return json({ data: await items.update(transform<ItemSchema>(await request.json())!) });
  } catch (e) {
    return jsonError(e, '/api/items', 'PATCH');
  }
};
