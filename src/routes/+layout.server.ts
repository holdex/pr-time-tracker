import { invalidations } from '$lib/config';
import type { User } from '$lib/server/github';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch, depends }) => {
  depends(invalidations.user);

  const data: { user: User | null } = await fetch('/api/github/auth/profile').then((res) =>
    res.json()
  );

  return {
    user: data.user
  };
};
