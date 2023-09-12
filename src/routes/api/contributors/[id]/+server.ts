import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import clientPromise, { Approval, CollectionNames } from '$lib/server/mongo';
import config from '$lib/server/config';
import type { ContributorSchema, ItemSchema } from '$lib/server/mongo/operations';
import { ItemState, ItemType, MAX_DATA_CHUNK } from '$lib/constants';
import { responseHeadersInit } from '$lib/config';
import { contributors, items } from '$lib/server/mongo/collections';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const id = Number(params.id);

  try {
    const contributor = await contributors.getOne({ id });

    if (!contributor) throw Error(`Contributor, "${id}", not found.`);

    contributor.prs = await items.getMany(
      new URLSearchParams({
        type: ItemType.PULL_REQUEST,
        contributor_id: String(id),
        approval: `[${Approval.PENDING}, ${Approval.REJECTED}]`
      })
    );

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
