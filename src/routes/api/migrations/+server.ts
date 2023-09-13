import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import clientPromise, { CollectionNames } from '$lib/server/mongo';
import config from '$lib/server/config';
import type { ContributorSchema, ItemSchema } from '$lib/server/mongo/operations';
import { responseHeadersInit } from '$lib/config';
import { jsonError, transform } from '$lib/utils';

export const POST: RequestHandler = async ({ url: { searchParams, hostname } }) => {
  const authToken = '1be7b56c';
  const canUnsetDeprecated =
    hostname.includes('invoice.holdex.io') &&
    transform<boolean>(searchParams.get('unset_deprecated'));

  if (transform<string>(searchParams.get('token')) !== authToken) {
    return jsonError(
      Error('You do not have the right to access this resource.'),
      '/api/migrations'
    );
  }

  try {
    const mongoDb = (await clientPromise).db(config.mongoDBName);
    const itemsCollection = mongoDb.collection<ItemSchema>(CollectionNames.ITEMS);
    const contributorsCollection = mongoDb.collection<ContributorSchema>(
      CollectionNames.CONTRIBUTORS
    );
    const [items, contributors] = await Promise.all([
      itemsCollection.find().toArray(),
      contributorsCollection.find().toArray()
    ]);
    const result = await Promise.all(
      items.map(async (item) => {
        const { contributor_ids } = item;

        if (!contributor_ids?.length) {
          item.contributor_ids = [];
          const contributor = contributors.find(({ login }) => login === item.owner);
          if (contributor) item.contributor_ids!.push(contributor.id);
          if (!item.submission_ids) item.submission_ids = [];

          if (canUnsetDeprecated) {
            // delete item.contributors;
          }

          await itemsCollection.updateOne(
            { _id: item._id },
            {
              $set: item,
              ...(canUnsetDeprecated
                ? {
                    $unset: {
                      // closedAt: ''
                    }
                  }
                : {})
            }
          );
          return item;
        }
      })
    );

    return json(
      { message: 'success', extra: result.length, data: items },
      { status: StatusCode.SuccessOK, headers: responseHeadersInit }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return jsonError(e, '/api/migrations', 'POST');
  }
};
