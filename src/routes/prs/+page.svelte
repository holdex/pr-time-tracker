<script lang="ts">
  /** externals */
  import { page } from '$app/stores';

  /** types */
  import type { CardProps } from '$lib/components/types';
  import type { PageData } from './$types';
  import type { User } from '@octokit/webhooks-types';

  /** internals */
  import PR from '$lib/components/Card/PR.svelte';
  import { snackbar } from '$lib/components/Snackbar';
  import { ItemType, ItemState, SubmitState } from '$lib/constants/constants';
  import { axios } from '$lib/utils/axios';
  import { createEffect } from '$lib/utils';
  import type { ItemCollection } from '$lib/server/mongo/operations';

  /** props */
  export let data: PageData;

  /** vars */
  const prs: Record<'submitted' | 'unsubmitted', ItemCollection[]> = {
    submitted: [],
    unsubmitted: []
  };
  let isSubmittedPrs = false;
  let isLoading = true;
  let user: User;

  /** funcs */
  const usePREffect = createEffect();

  const getPRs = async (query: { type?: ItemType; state?: ItemState; submitted?: SubmitState }) => {
    isLoading = true;

    try {
      const { type, submitted, state } = query;
      const response = await axios.get<{ result: ItemCollection[] }>(
        `/items?type=${type || ItemType.PULL_REQUEST}&owner=${
          user.login
        }&submitted=${submitted}&state=${state || ItemState.PENDING}`
      );

      prs[isSubmittedPrs ? 'submitted' : 'unsubmitted'] = response.data.result;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      $snackbar = { text: e.message || e, type: 'error' };
    } finally {
      isLoading = false;
    }
  };

  const onSubmit: CardProps['onSubmit'] = (pr) => async () => {
    $snackbar = { text: 'Please, wait...', type: 'busy' };

    try {
      await axios.post<{ result: ItemCollection }>(`/items`, {
        id: pr.id,
        hours: pr.hours,
        experience: pr.experience,
        submitted: true
      } as Partial<ItemCollection>);
      prs.unsubmitted = prs.unsubmitted.filter((submit) => submit.id !== pr.id);
      if (!pr.submitted) prs.submitted = [pr].concat(prs.submitted);
      $snackbar = {
        text: `Successfully submitted #${pr.number} with "${pr.hours} hour${
          Number(pr.hours) === 1 ? '' : 's'
        }" of efficiency.`,
        type: 'success'
      };

      return pr;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      $snackbar = { text: e.message || e, type: 'error' };
      return null;
    }
  };

  /** react-ibles */
  $: user = data.user!;
  $: isSubmittedPrs = $page.url.hash.includes('submitted');
  $: usePREffect(async () => {
    await getPRs({
      submitted: isSubmittedPrs ? SubmitState.SUBMITTED : undefined
    });
  }, [isSubmittedPrs]);
</script>

<main class="max-w-container m-auto py-4 animate-fadeIn md:py-8">
  <ul class="grid gap-4 md:gap-8">
    {#each prs[isSubmittedPrs ? 'submitted' : 'unsubmitted'] as pr}
      <PR data={pr} {onSubmit} />
    {:else}
      <li class="text-t3">
        {#if isLoading}
          Loading your {isSubmittedPrs ? '' : 'un'}submitted (Closed) Pull Requests...
        {:else}
          You don't have any ({isSubmittedPrs ? '' : 'un'}submitted) closed pull requests.
        {/if}
      </li>
    {/each}
  </ul>
</main>
