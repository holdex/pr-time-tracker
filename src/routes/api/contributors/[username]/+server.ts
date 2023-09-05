import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import clientPromise, { CollectionNames } from '$lib/server/mongo';
import config from '$lib/server/config';
import type { ContributorSchema } from '$lib/server/mongo/operations';
import { ItemState, MAX_DATA_CHUNK } from '$lib/constants';
import { ResponseHeadersInit } from '$lib/config';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const mongoClient = await clientPromise;
    const collection = mongoClient
      .db(config.mongoDBName)
      .collection<ContributorSchema>(CollectionNames.CONTRIBUTORS);
    const [contributor] = await collection
      .aggregate([
        {
          $match: { login: params.username }
        },
        {
          $lookup: {
            from: CollectionNames.ITEMS,
            localField: 'login',
            foreignField: 'owner',
            pipeline: [
              {
                $match: {
                  $or: [
                    { [ItemState.APPROVED]: { $exists: false } },
                    { [ItemState.APPROVED]: { $eq: false } }
                  ]
                }
              }
            ],
            as: 'prs'
          }
        }
      ])
      .limit(MAX_DATA_CHUNK)
      .toArray();

    if (!contributor) throw Error(`Contributor, "${params.username}", not found.`);

    return json(
      { message: 'success', result: contributor },
      { status: StatusCode.SuccessOK, headers: ResponseHeadersInit }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return json(
      { message: e.message || e, result: null, error: true },
      { status: StatusCode.ClientErrorNotFound }
    );
  }
};
