import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import { Collections, getDocumentsInfo } from '$lib/server/mongo/operations';

export const GET: RequestHandler = async () => {
  const mongoDB = await clientPromise;

  const documents = await (
    await getDocumentsInfo(mongoDB.db(config.mongoDBName), Collections.CONTRIBUTORS, {})
  ).toArray();

  return json({ message: 'success', result: documents }, { status: StatusCode.SuccessOK });
};
