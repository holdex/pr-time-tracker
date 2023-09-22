import { json } from '@sveltejs/kit';
import StatusCode from 'status-code-enum';

import type { RequestHandler } from '@sveltejs/kit';

import { responseHeadersInit } from '$lib/config';
import { jsonError, transform } from '$lib/utils';
import { contributors, items } from '$lib/server/mongo/collections';

import { UserRole } from '$lib/@types';

export const POST: RequestHandler = async ({ url: { searchParams } }) => {
  const authToken = '1be7b56cF2Gdfkrghsdsf';
  // const canUnsetDeprecated =
  // hostname.includes('invoice.holdex.io') &&
  // transform<boolean>(searchParams.get('unset_deprecated'));

  if (transform<string>(searchParams.get('token')) !== authToken) {
    return jsonError(
      Error('You do not have the right to access this resource.'),
      '/api/migrations'
    );
  }

  try {
    const [, _contributors] = await Promise.all([
      items.context.find().toArray(), //{ count: 5000 }),
      contributors.getMany({ count: 100 })
      // submissions.context.deleteMany()
    ]);
    const result = await Promise.all(
      _contributors.map(async (contributor) => {
        if (!contributor.role) {
          contributor.role = UserRole.CONTRIBUTOR;

          if (contributor.id === 1125014) {
            contributor.role = UserRole.MANAGER;
          }

          await contributors.update(contributor);
        }

        return contributor;
      })
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
