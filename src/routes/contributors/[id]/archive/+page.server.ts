import type { ContributorSchema } from '$lib/@types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const response: Response = await fetch(`/api/contributors/${params.id}`);
  const data: { result: ContributorSchema; message: string; error?: boolean } =
    await response.json();

  return {
    contributor: data.result,
    message: data.message,
    error: data.error
  };
};
