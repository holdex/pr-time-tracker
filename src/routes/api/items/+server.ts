import { error, json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import type { ItemCollection } from '$lib/server/mongo/operations';
import { Collections, getDocumentsInfo, updateCollectionInfo } from '$lib/server/mongo/operations';
import {
  ONE_MONTH,
  ItemType,
  ItemState,
  SubmitState,
  ArchiveState
} from '$lib/constants/constants';

const generateFilter = (
  type: ItemType,
  state: ItemState,
  owner: string,
  submitted: SubmitState,
  archived: ArchiveState
) => {
  let filter: any = {};

  if (type) {
    filter = {
      ...filter,
      type
    };
  }

  if (state) {
    if (state === ItemState.PENDING) {
      filter = {
        ...filter,
        $and: [
          {
            $or: [
              { [ItemState.APPROVED]: { $exists: false } },
              { [ItemState.APPROVED]: { $eq: false } }
            ]
          },
          {
            $or: [
              { [ItemState.REJECTED]: { $exists: false } },
              { [ItemState.REJECTED]: { $eq: false } }
            ]
          }
        ]
      };
    } else {
      filter = {
        ...filter,
        [state]: true
      };
    }
  }

  if (owner) {
    filter = {
      ...filter,
      owner
    };
  }

  if (submitted) {
    if (submitted === SubmitState.SUBMITTED) {
      filter = {
        ...filter,
        submitted: submitted === SubmitState.SUBMITTED
      };
    } else {
      filter = {
        ...filter,
        $or: [{ submitted: { $exists: false } }, { submitted: { $eq: false } }]
      };
    }
  }

  if (archived && archived === ArchiveState.ARCHIVED) {
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() - ONE_MONTH);

    filter = {
      ...filter,
      closedAt: { $gte: deadline }
    };
  }

  return filter;
};

export const GET: RequestHandler = async ({ url }) => {
  const { searchParams } = url;

  const type = searchParams.get('type') as ItemType;
  const state = (searchParams.get('state') as ItemState) ?? ItemState.PENDING;
  const owner = searchParams.get('owner') as string;
  const submitted = searchParams.get('submitted') as SubmitState;
  const archived = searchParams.get('archived') as ArchiveState;

  const filter = generateFilter(type, state, owner, submitted, archived);

  const mongoDB = await clientPromise;

  const documents = await (
    await getDocumentsInfo(mongoDB.db(config.mongoDBName), Collections.ITEMS, filter)
  ).toArray();

  return json({ message: 'success', result: documents }, { status: StatusCode.SuccessOK });
};

export const POST: RequestHandler = async ({ request }) => {
  const requestBody: ItemCollection = await request.json();

  if (requestBody.id === undefined) {
    throw error(StatusCode.ClientErrorBadRequest, 'id_is_missing');
  }

  const mongoDB = await clientPromise;
  const res = await updateCollectionInfo(
    mongoDB.db(config.mongoDBName),
    Collections.ITEMS,
    { id: requestBody.id },
    { $set: { ...requestBody } }
  );

  return json({ message: 'success', result: res }, { status: StatusCode.SuccessOK });
};
