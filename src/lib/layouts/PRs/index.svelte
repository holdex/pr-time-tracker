<script lang="ts">
  /** deps */
  import { page } from '$app/stores';

  import type { CardProps } from '$lib/components/types';
  import type { User } from '@octokit/webhooks-types';

  import PR from '$lib/components/Card/PR.svelte';
  import { snackbar } from '$lib/components/Snackbar';
  import { axios, getPRs, type PRsQuery } from '$lib/utils/request';
  import { createEffect } from '$lib/utils';
  import type { ContributorCollection, ItemCollection } from '$lib/server/mongo/operations';
  import { activeTab } from '$lib/components/Toggle';

  /** props */
  export let prs: ItemCollection[];
  export let context: 'contributor' | 'user' = 'user';
  export let query: Omit<PRsQuery, 'owner'> | undefined = undefined;
  export let getQuery: (() => Omit<PRsQuery, 'owner'>) | undefined = undefined;

  /** vars */
  const isContributorContext = context === 'contributor';
  const owner = ($page.data[context] as User | ContributorCollection | null)?.login;
  let invalidateCache = false;
  let isLoading: boolean | undefined;

  /** funcs */
  const usePRsEffect = createEffect();

  const onSubmit: CardProps['onSubmit'] = (pr, payload, isUpdate) => async () => {
    $snackbar = { text: 'Please, wait...', type: 'busy' };

    try {
      await axios.post<{ result: ItemCollection }>(`/items`, payload);
      if (!isUpdate) prs = prs.filter((submit) => submit.id !== pr.id);
      invalidateCache = true;
      $snackbar = {
        text: `Successfully ${
          isContributorContext ? `${payload.approved ? '' : 'dis'}approved` : 'submitted'
        } #${pr.number} ${isContributorContext ? 'of' : 'with'} "${pr.hours} hour${
          Number(pr.hours) === 1 ? '' : 's'
        }" of efficiency.`,
        type: 'success'
      };

      return { ...pr, ...payload };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      $snackbar = { text: e.message || e, type: 'error' };
      return null;
    }
  };

  /** react-ibles */
  $: usePRsEffect(async () => {
    if (!query && getQuery) query = getQuery();
    if (!owner) return (isLoading = false);
    if (isLoading) return;
    isLoading = true;
    prs = !prs.length || invalidateCache ? await getPRs({ ...query, owner }, invalidateCache) : prs;
    isLoading = false;
    invalidateCache = false;
  }, [$activeTab.position]);
</script>

<main class="max-w-container m-auto py-4 animate-fadeIn md:py-8">
  <ul class="grid gap-4 md:gap-8">
    {#each prs as pr, i}
      <!-- Force component destroy/re-render to get updated `pr` object values -->
      {#key invalidateCache ? pr : i}
        <PR data={pr} {onSubmit} isAdmin={isContributorContext} isReadonly={pr.approved} />
      {/key}
    {:else}
      <li class="text-t3">
        {#if !$activeTab.title || !owner}
          {$page.data.message || 'Please, wait...'}
        {:else if isLoading || isLoading === undefined}
          Loading {isContributorContext
            ? `contributor's "${$activeTab.title}"`
            : `your "${$activeTab.title}"`} (Closed) Pull Requests...
        {:else}
          {isContributorContext ? 'Contributor does not' : "You don't"} have any ({$activeTab.title.toLowerCase()})
          closed pull requests.
        {/if}
      </li>
    {/each}
  </ul>
</main>
