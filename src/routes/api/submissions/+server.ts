import { json } from '@sveltejs/kit';

import { dev } from '$app/environment';

import type { RequestHandler } from '@sveltejs/kit';

import { SUCCESS_OK } from '$lib/constants';
import { jsonError, transform } from '$lib/utils';
import { items, submissions } from '$lib/server/mongo/collections';
import { verifyAuth } from '$lib/server/github';
import { cookieNames } from '$lib/server/cookie';
import { insertEvent } from '$lib/server/gcloud';

import { UserRole, type SubmissionSchema, type ContributorSchema, EventType } from '$lib/@types';

export const GET: RequestHandler = async ({ url: { searchParams, pathname }, cookies }) => {
  try {
    await verifyAuth(pathname, 'GET', cookies);

    const id = transform<string>(searchParams.get('id'));
    const data = await (id ? submissions.getOne(id) : submissions.getMany());

    return json({ message: 'success', data }, { status: SUCCESS_OK });
  } catch (e) {
    return jsonError(e, '/api/submissions');
  }
};

export const POST: RequestHandler = async ({ url, request, cookies }) => {
  try {
    let body: SubmissionSchema = {} as SubmissionSchema;
    let contributor: string;

    await verifyAuth(url, 'POST', cookies, async ({ role, rate, login }) => {
      body = transform<SubmissionSchema>({ ...(await request.json()), rate })!;
      contributor = login;

      return role !== UserRole.MANAGER;
    });

    // get pr item
    const pr = await items.getOne({ id: body?.item_id });
    if (pr) {
      // store these events in gcloud
      await insertEvent({
        action: EventType.PR_SUBMISSION_CREATED,
        id: pr.id,
        index: 1,
        organization: pr.org,
        owner: pr.owner,
        repository: pr.repo,
        sender: contributor!,
        title: pr.title,
        payload: body?.hours,
        created_at: body?.created_at
      });
    }
    return json({
      data: await submissions.create(body!)
    });
  } catch (e) {
    return jsonError(e, '/api/submissions', 'POST');
  }
};

export const PATCH: RequestHandler = async ({ request, cookies, url }) => {
  try {
    let body: SubmissionSchema;
    let user: ContributorSchema;

    await verifyAuth(url, 'PATCH', cookies, async (contributor) => {
      user = contributor;

      if (dev) {
        user.role = (cookies.get(cookieNames.contributorRole) as UserRole | null) || user.role;
      }

      body = transform<SubmissionSchema>(await request.json(), {
        pick: ['_id' as keyof SubmissionSchema].concat(
          user.role === UserRole.MANAGER ? ['approval'] : ['hours', 'experience', 'owner_id']
        )
      })!;

      if (user.role !== UserRole.MANAGER && body.owner_id !== user.id) return false;

      return true;
    });

    // get pr item
    const pr = await items.getOne({ id: body!.item_id });
    if (pr) {
      // store these events in gcloud
      await insertEvent({
        action:
          user!.role === UserRole.MANAGER
            ? EventType.PR_SUBMISSION_APPROVED
            : EventType.PR_SUBMISSION_UPDATED,
        id: pr.id,
        index: 1,
        organization: pr.org,
        owner: pr.owner,
        repository: pr.repo,
        sender: user!.login,
        title: pr.title,
        payload: body!.hours,
        created_at: body!.created_at
      });
    }

    const submission = await submissions.update(body!, { user: user! });

    await items.update({ id: submission.item_id, updated_at: submission.updated_at! });

    return json({
      data: submission
    });
  } catch (e) {
    return jsonError(e, '/api/submissions', 'PATCH');
  }
};
