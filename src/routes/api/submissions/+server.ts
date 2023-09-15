import { json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';
import type { SubmissionSchema } from '$lib/@types';

import { SUCCESS_OK } from '$lib/constants';
import { jsonError, transform } from '$lib/utils';
import { submissions } from '$lib/server/mongo/collections';

export const GET: RequestHandler = async ({ url: { searchParams } }) => {
  try {
    const id = transform<string>(searchParams.get('id'));
    const data = await (id ? submissions.getOne(id) : submissions.getMany());

    return json({ message: 'success', data }, { status: SUCCESS_OK });
  } catch (e) {
    return jsonError(e, '/api/submissions');
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    return json({
      data: await submissions.create(transform<SubmissionSchema>(await request.json())!)
    });
  } catch (e) {
    return jsonError(e, '/api/submissions', 'POST');
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    // To-do: Add Authorization (through out endpoints) to restrict/prevent updating unauthorize (submission) paths
    return json({
      data: await submissions.update(
        transform<SubmissionSchema>(await request.json(), {
          omit: ['created_at', 'updated_at']
        })!
      )
    });
  } catch (e) {
    return jsonError(e, '/api/submissions', 'PATCH');
  }
};
