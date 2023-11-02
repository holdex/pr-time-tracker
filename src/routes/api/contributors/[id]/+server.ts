import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import { ItemType } from '$lib/constants';
import { responseHeadersInit } from '$lib/config';
import { contributors } from '$lib/server/mongo/collections';
import { verifyAuth } from '$lib/server/github';

import { Approval } from '$lib/@types';

export const GET: RequestHandler = async ({ params, cookies, url, fetch }) => {
  try {
    await verifyAuth(url, 'GET', cookies);

    const id = Number(params.id);
    const contributor = await contributors.getOne({ id });

    if (!contributor) throw Error(`Contributor, "${id}", not found.`);

    const prsResponse = await fetch(
      `/api/items?${new URLSearchParams({
        type: ItemType.PULL_REQUEST,
        contributor_id: String(id),
        approvals: JSON.stringify([Approval.PENDING, Approval.REJECTED]),
        count: '100'
      }).toString()}`
    );

    contributor.prs = (await prsResponse.json()).data || [];

    return json(
      { message: 'success', result: contributor },
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
