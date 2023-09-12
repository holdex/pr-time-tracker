<script lang="ts">
  /** externals */
  import { page } from '$app/stores';

  import type { User } from '@octokit/webhooks-types';

  /** internals */
  import PR from '$lib/components/Card/PR.svelte';
  import { getPRs } from '$lib/utils/request';
  import { createEffect } from '$lib/utils';
  import type { ItemSchema } from '$lib/server/mongo/operations';

  /** props */
  export let user: User | undefined = undefined;

  /** vars */
  let archive: ItemSchema[] = [];
  let isLoading = true;

  /** funcs */
  const usePREffect = createEffect();

  /** react-ibles */
  $: usePREffect(async () => {
    isLoading = true;
    archive = await getPRs({
      contributor_id: user ? user.id : Number($page.params.user_id),
      archived: true
    });
    isLoading = false;
  }, [user?.id || $page.params.user_id]);
</script>

<main class="max-w-container m-auto py-4 animate-fadeIn md:py-8">
  <ul class="grid gap-4 md:gap-8">
    {#each archive as pr}
      <PR data={pr} isReadonly />
    {:else}
      <li class="text-t3">
        {#if isLoading}
          Loading {user ? 'your' : "contributor's"} archived (Closed) Pull Requests...
        {:else}
          Nothing to show.
        {/if}
      </li>
    {/each}
  </ul>
</main>
