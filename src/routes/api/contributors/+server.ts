import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import type { ContributorSchema } from '$lib/server/mongo/operations';
import { MAX_DATA_CHUNK } from '$lib/constants';
import { responseHeadersInit } from '$lib/config';

import { CollectionNames } from '$lib/@types';

export const GET: RequestHandler = async () => {
  try {
    const mongoClient = await clientPromise;
    const collection = mongoClient
      .db(config.mongoDBName)
      .collection<ContributorSchema>(CollectionNames.CONTRIBUTORS);
    const contributors = await collection.find().limit(MAX_DATA_CHUNK).toArray();

    return json(
      { message: 'success', result: contributors },
      { status: StatusCode.SuccessOK, headers: responseHeadersInit }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return json(
      { message: e.message || e, result: null, error: true },
      { status: StatusCode.ServerErrorInternal }
    );
  }
};
