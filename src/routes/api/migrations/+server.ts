import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';
import { ObjectId } from 'mongodb';

import { dev } from '$app/environment';

import type { RequestHandler } from '@sveltejs/kit';

import { responseHeadersInit } from '$lib/config';
import { jsonError, transform } from '$lib/utils';
import { contributors, items } from '$lib/server/mongo/collections';
import { verifyAuth } from '$lib/server/github';

export const POST: RequestHandler = async ({ url: { searchParams, pathname }, cookies }) => {
  // const canUnsetDeprecated =
  // hostname.includes('invoice.holdex.io') &&
  // transform<boolean>(searchParams.get('unset_deprecated'));

  try {
    if (!dev) {
      await verifyAuth(
        pathname,
        'POST',
        cookies,
        () => transform<string>(searchParams.get('token')) === '1be7b5sdf6cF2Gdfkrghsdsfsfssdf'
      );
    }

    const [_items] = await Promise.all([
      items.context.find().toArray(), //{ count: 5000 }),
      contributors.getMany({ count: 100 })
      // submissions.getMany({ count: 1000 })
      // submissions.context.deleteMany()
    ]);
    const result = await Promise.all(
      _items.map(async (_item) => {
        await items.context.updateOne(
          { _id: _item._id },
          {
            $set: {
              submission_ids: _item.submission_ids?.map((id) => new ObjectId(id)) || []
            },
            $unset: {
              submission: '',
              submissions: '',
              __submission_ids: '',
              contributors: ''
            }
          }
        );

        return _item;
      })
      // _contributors.map(async (contributor) => {
      //   contributor.rate = 1;

      //   await contributors.update(contributor);

      //   return contributor;
      // })
      // _items.map(async (item) => {
      //   let needUpdate = false;

      //   // const contributor = _contributors.find(({ login }) => login === item.owner);

      //   if (item.submission) {
      //     needUpdate = true;
      //     delete item.submission;
      //     canUnsetDeprecated = true;
      //   }

      //   if (canUnsetDeprecated) {
      //     // needUpdate = true;
      //     // delete item.contributors;
      //   }

      //   if (needUpdate) {
      //     await items.context.updateOne(
      //       { _id: item._id },
      //       {
      //         $set: item,
      //         ...(canUnsetDeprecated
      //           ? {
      //               $unset: {
      //                 submission: ''
      //               }
      //             }
      //           : {})
      //       }
      //     );
      //   }

      //   return item;
      // })
    );

    return json(
      {
        message: 'success',
        extra: result.length,
        data: result
      },
      { status: StatusCode.SuccessOK, headers: responseHeadersInit }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return jsonError(e, '/api/migrations', 'POST');
  }
};
