import { error, json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

import clientPromise, { CollectionNames, type FilterProps } from '$lib/server/mongo';
import config from '$lib/server/config';
import type { ItemSchema } from '$lib/server/mongo/operations';
import { getDocumentsInfo, updateCollectionInfo } from '$lib/server/mongo/operations';
import {
  ONE_MONTH,
  ItemType,
  ItemState,
  SubmitState,
  ArchiveState,
  SUCCESS_OK,
  BAD_REQUEST
} from '$lib/constants';
import { transform } from '$lib/utils';

const generateFilter = (params: URLSearchParams) => {
  const [closed, type, state, owner, submitted, archived, count] = [
    transform<boolean>(params.get('closed')),
    transform<ItemType>(params.get('type')),
    transform<ItemState>(params.get('state')),
    transform<string>(params.get('owner')),
    transform<SubmitState>(params.get('submitted')),
    transform<ArchiveState>(params.get('archived')),
    transform<number>(params.get('count'))
  ];
  const filter: Partial<FilterProps> = {
    merged: closed ?? true
  };

  if (type) filter.type = type;

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

  if (owner) filter.owner = owner;

  if (submitted === SubmitState.SUBMITTED) {
    filter.submitted = submitted === SubmitState.SUBMITTED;
  } else if (!submitted) {
    filter.$or = [{ submitted: { $exists: false } }, { submitted: { $eq: false } }];
  }

  if (archived === ArchiveState.ARCHIVED) {
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() - ONE_MONTH);

    filter.closedAt = { $gte: deadline };
  }

  return { filter, count };
};

export const GET: RequestHandler = async ({ url }) => {
  const { searchParams } = url;

  const { filter, count } = generateFilter(searchParams);
  const mongoDB = await clientPromise;
  const documents = await (
    await getDocumentsInfo(mongoDB.db(config.mongoDBName), CollectionNames.ITEMS, filter, count)
  ).toArray();

  return json({ message: 'success', result: documents }, { status: SUCCESS_OK });
};

export const POST: RequestHandler = async ({ request }) => {
  const requestBody: ItemSchema = await request.json();

  if (requestBody.id === undefined) {
    throw error(BAD_REQUEST, 'id_is_missing');
  }

  const mongoDB = await clientPromise;
  const res = await updateCollectionInfo(
    mongoDB.db(config.mongoDBName),
    CollectionNames.ITEMS,
    { id: requestBody.id },
    { $set: { ...requestBody } }
  );

  return json({ message: 'success', result: res }, { status: SUCCESS_OK });
};
