import { error, json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';
import type { Filter, WithId } from 'mongodb';

import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import type { ItemCollection } from '$lib/server/mongo/operations';
import { Collections, getDocumentsInfo, updateCollectionInfo } from '$lib/server/mongo/operations';
import {
  ONE_MONTH,
  ItemType,
  ItemState,
  SubmitState,
  ArchiveState,
  SUCCESS_OK,
  BAD_REQUEST
} from '$lib/constants';

interface FilterProps {
  $and: Filter<WithId<ItemCollection>>[];
  $or: FilterProps['$and'];
  [key: string]: any;
}

const generateFilter = (params: URLSearchParams) => {
  const type = params.get('type') as ItemType | string | null;
  const state = params.get('state') as ItemState | string | null;
  const owner = params.get('owner') as string;
  const submitted = params.get('submitted') as SubmitState | string | null;
  const archived = params.get('archived') as ArchiveState | string | null;
  const count = params.get('count');
  const filter: Partial<FilterProps> = {};

  if (type !== 'undefined') {
    filter.type = type;
  }

  if (state !== 'undefined') {
    if (state === ItemState.PENDING) {
      filter.$and = [
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
      ];
    } else if (state) {
      filter[state as ItemState] = true;
    }
  }

  if (owner !== 'undefined' && owner) {
    filter.owner = owner;
  }

  if (submitted === SubmitState.SUBMITTED) {
    filter.submitted = submitted === SubmitState.SUBMITTED;
  } else if (!submitted || submitted === 'undefined') {
    filter.$or = [{ submitted: { $exists: false } }, { submitted: { $eq: false } }];
  }

  if (archived === ArchiveState.ARCHIVED) {
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() - ONE_MONTH);

    filter.closedAt = { $gte: deadline };
  }

  return { filter, count: count === 'undefined' ? undefined : Number(count) };
};

export const GET: RequestHandler = async ({ url }) => {
  const { searchParams } = url;

  const { filter, count } = generateFilter(searchParams);
  const mongoDB = await clientPromise;
  const documents = await (
    await getDocumentsInfo(mongoDB.db(config.mongoDBName), Collections.ITEMS, filter, count)
  ).toArray();

  return json({ message: 'success', result: documents }, { status: SUCCESS_OK });
};

export const POST: RequestHandler = async ({ request }) => {
  const requestBody: ItemCollection = await request.json();

  if (requestBody.id === undefined) {
    throw error(BAD_REQUEST, 'id_is_missing');
  }

  const mongoDB = await clientPromise;
  const res = await updateCollectionInfo(
    mongoDB.db(config.mongoDBName),
    Collections.ITEMS,
    { id: requestBody.id },
    { $set: { ...requestBody } }
  );

  return json({ message: 'success', result: res }, { status: SUCCESS_OK });
};
