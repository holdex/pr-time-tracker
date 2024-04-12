import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

import { invalidations } from '$lib/config';
import { items } from '$lib/server/mongo/collections';

export const load: PageServerLoad = async ({ params, depends, parent }) => {
  depends(invalidations.user);

  const { user } = await parent();
  const data = await items.getOneWithSubmission(
    {
      id: Number(params.id),
      repo: params.repo,
      org: params.org
    },
    user?.id
  );
  if (!data || data.length === 0) {
    throw error(404, 'pr_not_found');
  }
  return {
    pr: JSON.stringify(data[0])
  };
};
