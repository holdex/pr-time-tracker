import type { PageServerLoad } from './$types';
import type { ContributorSchema } from '$lib/@types';

import { invalidations } from '$lib/config';

export const load: PageServerLoad = async ({ fetch, depends }) => {
  depends(invalidations.user);

  const response: Response = await fetch(`/api/contributors`);
  const data: {
    result: ContributorSchema[] | null;
    message: string;
    error?: boolean;
  } = await response.json();

  return {
    contributors: data.result,
    message: data.error && data.message,
    error: data.error
  };
};
