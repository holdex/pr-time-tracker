import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import clientPromise, { CollectionNames } from '$lib/server/mongo';
import config from '$lib/server/config';
import type { ContributorSchema, ItemSchema } from '$lib/server/mongo/operations';
import { ResponseHeadersInit } from '$lib/config';
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
        const { contributorIds, contributor_ids } = item;

        // if (!contributor_ids) {
        item.contributor_ids = [];
        contributorIds?.forEach((__id) => {
          const contributor = contributors.find(({ _id }) => _id.toString() === __id?.toString());

          if (contributor) item.contributor_ids!.push(contributor.id);
        });
        if (!item.submission_ids) item.submission_ids = [];
        if (!item.created_at) item.created_at = item.createdAt;
        if (!item.updated_at) item.updated_at = item.updatedAt;
        if (!item.closed_at) item.closed_at = item.closedAt;

        if (canUnsetDeprecated) {
          delete item.contributorIds;
          delete item.contributors;
          delete item.submissions;
          delete item.closedAt;
          delete item.createdAt;
          delete item.updatedAt;
        }

        await itemsCollection.updateOne(
          { _id: item._id },
          {
            $set: item,
            ...(canUnsetDeprecated
              ? {
                  $unset: {
                    contributorIds: [],
                    contributors: [],
                    submissions: [],
                    createdAt: '',
                    updatedAt: '',
                    closedAt: ''
                  }
                }
              : {})
          }
        );
        return item;
        // }
      })
    );

    return json(
      { message: 'success', extra: result.length, data: items },
      { status: StatusCode.SuccessOK, headers: ResponseHeadersInit }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return jsonError(e, '/api/migrations', 'POST');
  }
};
