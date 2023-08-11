import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import { ItemState, ItemType } from '$lib/constants/constants';
import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import { Collections, getDocumentsInfo, getAggregation } from '$lib/server/mongo/operations';

const generatePipeline = (owner: string, type: ItemType, state: ItemState) => {
  const query = {
    $lookup: {
      from: Collections.ITEMS,
      localField: 'login',
      foreignField: 'owner',
      pipeline: <any>[],
      as: 'items'
    }
  };

  if (state) {
    if (state === ItemState.PENDING) {
      query.$lookup.pipeline = [
        {
          $match: {
            $and: [
              { type: { $eq: type } },
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
          }
        }
      ];
    } else {
      query.$lookup.pipeline = [
        {
          $match: {
            type: { $eq: type },
            [state]: { $eq: true }
          }
        }
      ];
    }
  }

  const pipeline: any[] = [
    {
      $match: {
        login: { $eq: owner }
      }
    }
  ];

  pipeline.push(query);

  return pipeline;
};

export const GET: RequestHandler = async ({ url }) => {
  const { searchParams } = url;

  const state = (searchParams.get('state') as ItemState) ?? ItemState.PENDING;
  const owner = searchParams.get('name') as string;
  const type = (searchParams.get('type') as ItemType) ?? ItemType.PULL_REQUEST;

  const mongoDB = await clientPromise;
  let result = [];

  if (state) {
    const pipeline = generatePipeline(owner, type, state);

    result = await (
      await getAggregation(mongoDB.db(config.mongoDBName), Collections.CONTRIBUTORS, pipeline)
    ).toArray();
  } else {
    result = await (
      await getDocumentsInfo(mongoDB.db(config.mongoDBName), Collections.CONTRIBUTORS, {})
    ).toArray();
  }

  return json({ message: 'success', result }, { status: StatusCode.SuccessOK });
};
