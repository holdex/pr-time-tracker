import type { PageServerLoad } from './$types';

import { invalidations } from '$lib/config';
import type { ItemCollection } from '$lib/server/mongo/operations';
import { ItemType } from '$lib/constants';

export const load: PageServerLoad = async ({ fetch, depends, parent }) => {
  depends(invalidations.user);

  const parentData = await parent();
  const response: Response = await fetch(
    `/api/items?type=${ItemType.PULL_REQUEST}&owner=${parentData.user?.login}&submitted=false`
  );
  const data: {
    result: ItemCollection[] | null;
    message: string;
    error?: boolean;
  } = await response.json();

  return {
    prs: data.result,
    message: data.error ? data.message : '',
    error: data.error
  };
};
