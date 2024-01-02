import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import { ItemType } from '$lib/constants';
import { responseHeadersInit } from '$lib/config';
import { contributors } from '$lib/server/mongo/collections';
import { verifyAuth } from '$lib/server/github';
import { computeCycleTime } from '$lib/utils';

import { Approval } from '$lib/@types';

export const GET: RequestHandler = async ({ params, cookies, url, fetch }) => {
  try {
    await verifyAuth(url, 'GET', cookies);

    const id = Number(params.id);

    const prsResponse = await fetch(
      `/api/items?${new URLSearchParams({
        type: ItemType.PULL_REQUEST,
        contributor_id: String(id),
        approvals: JSON.stringify([Approval.PENDING, Approval.REJECTED]),
        count: '100',
        last: 'true'
      }).toString()}`
    );

    let prs = (await prsResponse.json()).data || [];

    prs = prs.map((r: any) => ({
      title: r.title,
      url: r.url,
      merged: r.merged,
      created_at: r.created_at,
      closed_at: r.closed_at,
      hours: r.submission?.hours,
      cycle_hours: computeCycleTime(r.created_at, r.closed_at)
    }));

    return json(
      { message: 'success', result: prs },
      { status: StatusCode.SuccessOK, headers: responseHeadersInit }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return json(
      { message: e.message || e, result: null, error: true },
      { status: StatusCode.ClientErrorNotFound }
    );
  }
};
