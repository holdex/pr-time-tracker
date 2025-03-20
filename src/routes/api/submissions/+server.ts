import { json } from '@sveltejs/kit';
import axios from 'axios';

import { dev } from '$app/environment';
import { TRIGGER_SERVER_SECRET, TRIGGER_SERVER_URL } from '$env/static/private';

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
    let contributor: any;

    await verifyAuth(url, 'POST', cookies, async (user) => {
      body = transform<SubmissionSchema>({ ...(await request.json()), rate: user.rate })!;
      contributor = user;
      return body.owner_id === user.id;
    });

    // get pr item
    const pr = await items.getOne({ id: body?.item_id });
    const submission = await submissions.create(body!);

    if (pr) {
      // store these events in gcloud
      const event = {
        action: EventType.PR_SUBMISSION_CREATED,
        id: pr.number as number,
        index: 1,
        organization: pr.org,
        owner: pr.owner,
        repository: pr.repo,
        sender: contributor.login!,
        title: pr.title,
        payload: body?.hours,
        created_at: Math.round(new Date().getTime() / 1000).toFixed(0),
        updated_at: Math.round(new Date().getTime() / 1000).toFixed(0)
      };
      await insertEvent(
        event,
        `${body?.item_id}_${contributor.login!}_${event.created_at}_${event.action}`
      );

      await triggerRequestCheckRun({
        org: pr.org,
        repoName: pr.repo,
        senderId: contributor.id!,
        senderLogin: contributor.login!,
        prNumber: pr.number as number
      });
    }

    return json({
      data: submission
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
        pick: ['_id' as keyof SubmissionSchema].concat([
          'hours',
          'approval',
          'experience',
          'item_id',
          'owner_id',
          'created_at',
          'updated_at'
        ])
      })!;

      if (user.role !== UserRole.MANAGER && body.owner_id !== user.id) return false;

      return true;
    });

    // get pr item
    const pr = await items.getOne({ id: body!.item_id });
    if (pr) {
      const createdAtDate = validateDate(body!.created_at as string);
      const updatedAtDate = validateDate(body!.updated_at as string);

      // store these events in gcloud
      const gcEvent = {
        action:
          user!.role === UserRole.MANAGER
            ? EventType.PR_SUBMISSION_APPROVED
            : EventType.PR_SUBMISSION_CREATED,
        id: pr.number as number,
        index: 1,
        organization: pr.org,
        owner: pr.owner,
        repository: pr.repo,
        sender: user!.login,
        title: pr.title,
        payload: body!.hours,
        created_at: Math.round(createdAtDate.getTime() / 1000).toFixed(0),
        updated_at: Math.round(updatedAtDate.getTime() / 1000).toFixed(0)
      };
      await insertEvent(
        gcEvent,
        `${body!.item_id}_${user!.login}_${gcEvent.created_at}_${gcEvent.action}`
      );

      if (body!.approval === 'pending') {
        // get last commit
        await triggerRequestCheckRun({
          org: pr.org,
          repoName: pr.repo,
          senderId: body!.owner_id,
          senderLogin: user!.login,
          prNumber: pr.number as number
        });
      }
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

const validateDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

async function triggerRequestCheckRun(data: {
  org: string;
  repoName: string;
  senderId: number;
  senderLogin: string;
  prNumber: number;
}) {
  try {
    const url = TRIGGER_SERVER_URL;
    const secret = TRIGGER_SERVER_SECRET;

    if (!url || !secret) throw new Error('Trigger server not configured');

    const res = await axios.post(`${url}/api/submission-event`, data, {
      headers: {
        'x-trigger-server-secret': secret
      }
    });

    if (res.status !== 200) throw new Error(res.data.message);
  } catch (e) {
    const resData = (e as any)?.response?.data;
    throw new Error(resData ? JSON.stringify(resData) : 'Failed to trigger check run');
  }
}
