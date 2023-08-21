import type { PageServerLoad } from './$types';

import { invalidations } from '$lib/config';
import type { ContributorCollection } from '$lib/server/mongo/operations';

export const load: PageServerLoad = async ({ fetch, depends }) => {
  depends(invalidations.user);

  const response: Response = await fetch(`/api/contributors`);
  const data: {
    result: ContributorCollection[] | null;
    message: string;
    error?: boolean;
  } = await response.json();

  return {
    contributors: data.result,
    message: data.error && data.message,
    error: data.error
  };
};
