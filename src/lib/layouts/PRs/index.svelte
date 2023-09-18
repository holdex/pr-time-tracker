<script lang="ts">
  /** deps */
  import { page } from '$app/stores';

  import type { CardProps } from '$lib/components/types';
  import type { User } from '@octokit/webhooks-types';

  import PR from '$lib/components/Card/PR.svelte';
  import { snackbar } from '$lib/components/Snackbar';
  import { axios, getPRs, type PRsQuery } from '$lib/utils/request';
  import { createEffect } from '$lib/utils';
  import type { ContributorSchema, ItemSchema } from '$lib/server/mongo/operations';
  import { activeTab } from '$lib/components/Toggle';

  import { Approval, type SubmissionSchema } from '$lib/@types';

  /** props */
  export let prs: ItemSchema[];
  export let context: 'contributor' | 'user' = 'user';
  export let query: Omit<PRsQuery, 'contributor_id'> | undefined = undefined;
  export let getQuery: (() => Omit<PRsQuery, 'contributor_id'>) | undefined = undefined;

  /** vars */
  const isContributorContext = context === 'contributor';
  const contributorId = ($page.data[context] as User | ContributorSchema | null)?.id;
  let invalidateCache = false;
  let isLoading: boolean | undefined;

  /** funcs */
  const usePRsEffect = createEffect();

  const onSubmit: CardProps['onSubmit'] = (submission, number, isUpdate) => async () => {
    $snackbar = { text: 'Please, wait...', type: 'busy' };

    try {
      const response = await axios[isUpdate ? 'patch' : 'post']<{ data: SubmissionSchema }>(
        `/submissions`,
        submission
      );

      if (!isUpdate) prs = prs.filter((pr) => pr.id !== submission.item_id);
      invalidateCache = true;
      $snackbar = {
        text: `Successfully ${
          isContributorContext
            ? `${submission.approval === Approval.APPROVED ? '' : 'dis'}approved`
            : 'submitted'
        } #${number} ${isContributorContext ? 'of' : 'with'} "${submission.hours} hour${
          Number(submission.hours) === 1 ? '' : 's'
        }" of efficiency.`,
        type: 'success'
      };

      return response.data.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      $snackbar = { text: e.message || e, type: 'error' };
      return null;
    }
  };

  /** react-ibles */
  $: usePRsEffect(async () => {
    if (!query && getQuery) query = getQuery();
    if (!contributorId) return (isLoading = false);
    if (isLoading) return;
    isLoading = true;
    prs =
      !prs.length || invalidateCache
        ? await getPRs({ ...query, contributor_id: contributorId }, invalidateCache)
        : prs;
    isLoading = false;
    invalidateCache = false;
  }, [$activeTab.position]);
</script>

<main class="max-w-container m-auto py-4 animate-fadeIn md:py-8">
  <ul class="grid gap-4 md:gap-8">
    {#each prs as pr, i}
      <!-- Force component destroy/re-render to get updated `pr` object values. -->
      {#key invalidateCache ? pr : `${i} ${$activeTab.position}`}
        <PR
          data={pr}
          {onSubmit}
          isAdmin={isContributorContext}
          isReadonly={pr.submission?.approval === Approval.APPROVED} />
      {/key}
    {:else}
      <li class="text-t3">
        {#if !$activeTab.title || !contributorId}
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
