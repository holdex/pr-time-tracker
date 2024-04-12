import type { PageLoad } from './$types';

import { invalidations } from '$lib/config';

export const load: PageLoad = async ({ data, depends }) => {
  depends(invalidations.user);
  return {
    pr: JSON.parse(data.pr)
  };
};
