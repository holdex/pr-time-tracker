import type { PageServerLoad } from './$types';

import { invalidations } from '$lib/config';
import type { ContributorCollection, ItemCollection } from '$lib/server/mongo/operations';

export const load: PageServerLoad = async ({ fetch, depends, params }) => {
  depends(invalidations.user);

  const response: Response = await fetch(`/api/contributors/${params.username}`);
  const data: {
    result: (ContributorCollection & { prs: ItemCollection[] }) | null;
    message: string;
    error?: boolean;
  } = await response.json();

  return {
    contributor: data.result,
    message: data.error ? data.message : '',
    error: data.error
  };
};
