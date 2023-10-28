import { json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

import { jsonError, transform } from '$lib/utils';
import { items } from '$lib/server/mongo/collections';
import { verifyAuth } from '$lib/server/github';
import { cookieNames } from '$lib/server/cookie';

import { UserRole, type ItemSchema } from '$lib/@types';

//   if (archived === ArchiveState.ARCHIVED) {
//     const deadline = new Date();
//     deadline.setMonth(deadline.getMonth() - ONE_MONTH);

//     filter.closedAt = { $gte: deadline.toString() };
//   }

export const GET: RequestHandler = async ({ url: { searchParams, pathname }, cookies }) => {
  try {
    await verifyAuth(pathname, 'GET', cookies);

    if (cookies.get(cookieNames.contributorRole) === UserRole.MANAGER) {
      searchParams.append('contributors', 'true');
      searchParams.append('submissions', 'true');
    }

    return json({ data: await items.getMany(searchParams) });
  } catch (e) {
    return jsonError(e, '/api/items');
  }
};

export const PATCH: RequestHandler = async ({ request, url: { pathname }, cookies }) => {
  try {
    await verifyAuth(pathname, 'PATCH', cookies);

    return json({ data: await items.update(transform<ItemSchema>(await request.json())!) });
  } catch (e) {
    return jsonError(e, '/api/items', 'PATCH');
  }
};
