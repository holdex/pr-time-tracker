<script lang="ts">
  /** types */
  import type { PageData } from './$types';
  import type { User } from '@octokit/webhooks-types';

  /** internals */
  import Contributor from '$lib/components/Card/Contributor.svelte';
  import { axios, createEffect } from '$lib/utils';
  import type { ContributorCollection } from '$lib/server/mongo/operations';
  import { snackbar } from '$lib/components/Snackbar';

  /** props */
  export let data: PageData;

  /** vars */
  let contributors: ContributorCollection[] = data.contributors || [];
  let isLoading = true;
  let user: User;

  /** funcs */
  const useContributorEffect = createEffect();

  const getContributors = async () => {
    try {
      const response = await axios.get<{ result: ContributorCollection[] }>('/contributors');

      return response.data.result;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      $snackbar = { text: e.message || e, type: 'error' };
      return [];
    }
  };

  /** react-ibles */
  $: user = data.user!;
  $: useContributorEffect(async () => {
    isLoading = true;
    contributors = !contributors.length ? await getContributors() : contributors;
    isLoading = false;
  }, [!contributors.length]);
</script>

<main class="max-w-container m-auto py-4 animate-fadeIn md:py-8">
  <ul class="grid gap-4 md:gap-8">
    {#each contributors as { avatarUrl, login, name }}
      <Contributor avatar_url={avatarUrl} {name} username={login} />
    {:else}
      <li class="text-t3">
        {#if isLoading}
          Loading contributors...
        {:else}
          There are currently no contributors.
        {/if}
      </li>
    {/each}
  </ul>
</main>
