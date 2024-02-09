import { json, type RequestHandler } from '@sveltejs/kit';

import { SUCCESS_OK } from '$lib/constants';
import { submissions } from '$lib/server/mongo/collections';
import { jsonError, transform } from '$lib/utils';
import { personalApp } from '$lib/server/github';

export const GET: RequestHandler = async ({ request: { headers }, url: { searchParams } }) => {
  try {
    const token = headers.get('Authorization');
    const authData = (await personalApp.auth()) as any;
    if (authData?.token !== token) {
      return jsonError({ message: 'not allowed' }, '/api/submissions/[id]');
    }

    const ownerId = transform<number>(searchParams.get('owner_id'));
    const itemId = transform<number>(searchParams.get('item_id'));

    const data = await getSubmissionStatus(ownerId as number, itemId as number);
    return json({ message: 'success', data }, { status: SUCCESS_OK });
  } catch (e) {
    return jsonError(e, '/api/submissions/[id]');
  }
};

const getSubmissionStatus = async (ownerId: number, itemId: number): Promise<null | number> => {
  const submission = await submissions.getOne({ owner_id: ownerId, item_id: itemId });

  if (submission) {
    return submission.hours;
  }
  return null;
};
