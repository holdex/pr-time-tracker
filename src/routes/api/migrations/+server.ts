import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import { responseHeadersInit } from '$lib/config';
import { jsonError, transform } from '$lib/utils';
// import { submissions } from '$lib/server/mongo/collections';
import { contributors, items, submissions } from '$lib/server/mongo/collections';

export const POST: RequestHandler = async ({ url: { searchParams, hostname } }) => {
  const authToken = '1be7b56cF2Gdfkr';
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
    const [_items, _contributors] = await Promise.all([
      items.getMany({ count: 1000 }),
      contributors.getMany()
      // submissions.context.deleteMany()
    ]);
    const result = await Promise.all(
      _items.map(async (item) => {
        const { submission_ids } = item;
        const needUpdate = false;

        const contributor = _contributors.find(({ login }) => login === item.owner);

        if (contributor) {
          if (!submission_ids?.length && (item as any).submitted) {
            // needUpdate = true;
            await submissions.create({
              item_id: item.id,
              owner_id: contributor.id,
              hours: parseFloat((item as any).hours),
              experience: (item as any).experience
            });
            // await submissions.context.deleteMany({ item_id: item.id });
          }

          // if (!(item as any).owner_id) {
          //   item.owner_id = contributor.id;
          //   needUpdate = true;
          // }
        }

        if (item.submission_ids?.length) {
          // needUpdate = true;
          // item.submission_ids = [];
        }

        if (canUnsetDeprecated) {
          // delete item.contributors;
          delete (item as any).submitted;
          delete (item as any).hours;
          delete (item as any).experience;
        }

        if (needUpdate) {
          await items.context.updateOne(
            { _id: item._id },
            {
              $set: item,
              ...(canUnsetDeprecated
                ? {
                    $unset: {
                      // closedAt: ''
                      submitted: '',
                      hours: '',
                      experience: ''
                    }
                  }
                : {})
            }
          );
        }

        return item;
      })
    );

    return json(
      { message: 'success', extra: result.length, data: _items },
      { status: StatusCode.SuccessOK, headers: responseHeadersInit }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return jsonError(e, '/api/migrations', 'POST');
  }
};
