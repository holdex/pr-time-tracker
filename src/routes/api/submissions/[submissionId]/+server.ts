import { json, type RequestHandler } from '@sveltejs/kit';

import { SUCCESS_OK } from '$lib/constants';
import config from '$lib/server/config';
import { submissions } from '$lib/server/mongo/collections';
import { jsonError, transform } from '$lib/utils';

export const GET: RequestHandler = async ({ url: { searchParams } }) => {
  try {
    if (searchParams.get('token') !== config.github.token) {
      return jsonError('authorization failed', '/api/submission');
    }

    const owner_id = transform<number>(searchParams.get('owner_id'));
    const item_id = transform<number>(searchParams.get('item_id'));

    if (!owner_id || !item_id) return jsonError('missing params', '/api/submission');

    const data = await submissions.getOne({ owner_id, item_id });
    return json({ message: 'success', data }, { status: SUCCESS_OK });
  } catch (e) {
    return jsonError(e, '/api/submission');
  }
};
