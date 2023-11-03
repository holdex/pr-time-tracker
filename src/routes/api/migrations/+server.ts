import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import { dev } from '$app/environment';

import type { RequestHandler } from '@sveltejs/kit';
import type { ContributorSchema } from '$lib/@types';

import { responseHeadersInit } from '$lib/config';
import { jsonError, transform } from '$lib/utils';
import { contributors, submissions } from '$lib/server/mongo/collections';
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

    const contributorsMap: Record<number, ContributorSchema> = {};
    const [_submissions, _contributors] = await Promise.all([
      submissions.context
        .find({
          created_at: { $lt: '2023-11-01T00:00:00.000Z' }
        })
        .sort('updated_at', 'descending')
        .toArray(), //{ count: 5000 }),
      contributors.getMany({ count: 100 })
      // submissions.getMany({ count: 1000 })
      // submissions.context.deleteMany()
    ]);
    const result = await Promise.all(
      _submissions.map(async (_submission) => {
        const contributor =
          contributorsMap[_submission.owner_id] ||
          _contributors.find(({ id }) => id === _submission.owner_id);

        if (contributor) contributorsMap[contributor.id] = contributor;

        await submissions.context.updateOne(
          { _id: _submission._id },
          {
            $set: {
              rate: _submission.rate || contributor.rate
            }
          }
        );

        return _submission;
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
