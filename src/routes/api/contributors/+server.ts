import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import { Collections, getListOfField } from '$lib/server/mongo/operations';

export const GET: RequestHandler = async ({ url }) => {
  const { searchParams } = url;

  const fieldName = searchParams.get('field') as string;

  const mongoDB = await clientPromise;

  const documents = await getListOfField(
    mongoDB.db(config.mongoDBName),
    Collections.ITEMS,
    fieldName
  );

  return json({ message: 'success', result: documents }, { status: StatusCode.SuccessOK });
};
