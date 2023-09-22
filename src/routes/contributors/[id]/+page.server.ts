import type { PageServerLoad } from './$types';
import type { ContributorSchema, ItemSchema } from '$lib/@types';

import { invalidations } from '$lib/config';

export const load: PageServerLoad = async ({ fetch, depends, params }) => {
  depends(invalidations.user);

  const response: Response = await fetch(`/api/contributors/${params.id}`);
  const data: {
    result: (ContributorSchema & { prs: ItemSchema[] }) | null;
    message: string;
    error?: boolean;
  } = await response.json();

  return {
    contributor: data.result,
    message: data.error ? data.message : '',
    error: data.error
  };
};
