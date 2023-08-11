import { invalidations } from '$lib/config';
import type { User } from '$lib/server/github';

export const load = async ({ fetch, depends }: { fetch: any; depends: any }) => {
  depends(invalidations.user);

  const data: { user: User | null } = await fetch('/api/github/auth/profile').then((res: any) =>
    res.json()
  );

  return {
    user: data.user
  };
};

// TODO: return data of the user from Git
