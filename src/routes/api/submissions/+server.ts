import { json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

import type { SubmissionSchema } from '$lib/server/mongo';
import { SUCCESS_OK } from '$lib/constants';
import { jsonError, transform } from '$lib/utils';
import { submissions } from '$lib/server/mongo/collections';

export const GET: RequestHandler = async ({ url: { searchParams } }) => {
  try {
    const id = transform<string>(searchParams.get('id'));
    const data = await (id ? submissions.getOne(id) : submissions.getMany());

    return json({ message: 'success', data }, { status: SUCCESS_OK });
  } catch (e) {
    return jsonError(e, '/api/submissions', 'GET');
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = transform<SubmissionSchema>(await request.json())!;
    const data = await submissions.create(body);

    return json({ data: { _id: data.insertedId, ...body } });
  } catch (e) {
    return jsonError(e, '/api/submissions', 'POST');
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const body = transform<SubmissionSchema>(await request.json())!;
    const data = await submissions.update(body);

    return json({ data: { _id: data.upsertedId, ...body } });
  } catch (e) {
    return jsonError(e, '/api/submissions', 'PATCH');
  }
};
