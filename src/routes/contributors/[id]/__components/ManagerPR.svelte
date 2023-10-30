<script lang="ts">
  import type { CardProps } from '$lib/components/types';
  import type { ContributorSchema, Experience, SubmissionSchema } from '$lib/@types';

  import Button from '$lib/components/Button/index.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import Icon from '$lib/components/Icon/index.svelte';
  import PR from '$lib/components/Card/PR.svelte';
  import { createEffect } from '$lib/utils';

  import CostBreakdown from './CostBreakdown.svelte';

  /** props */
  export let isReadonly = false;
  export let isAdmin = false;
  export let loading = false;
  export let data: CardProps['data'];
  export let onSubmit: CardProps['onSubmit'] = undefined;

  /** vars */
  let openedAt: Date | undefined;
  let showBreakdown = false;
  let totalCost = 0;
  let breakdown: Array<{
    avatarUrl?: string;
    name?: string;
    experience?: Experience;
    rate: number;
    hours?: number;
    cost: number | string;
  }> = [];
  let owner: ContributorSchema;
  let otherContributors: ContributorSchema[] = [];
  const submissionsMap: Record<string, SubmissionSchema | undefined> = {};

  const useSubmissionEffect = createEffect();

  /** react-ibles */
  $: useSubmissionEffect(() => {
    totalCost = 0;
    otherContributors = [];
    breakdown =
      data.contributors?.map((contributor) => {
        const { id, rate, avatarUrl, name } = contributor;
        const submission = data.submissions?.find(({ owner_id }) => owner_id === id);
        const cost = Number(((submission?.hours || 0) * rate).toFixed(2));

        totalCost += cost;
        if (name === data.owner) owner = contributor;
        else otherContributors.push(contributor);
        submissionsMap[name] = submission;

        return {
          experience: submission?.experience,
          rate,
          avatarUrl,
          hours: submission?.hours,
          name,
          cost
        };
      }) || [];
  }, [data.submissions?.length]);
  $: openedAt = data.created_at ? new Date(data.created_at) : undefined;
</script>

<PR {isReadonly} {isAdmin} {loading} {data} {onSubmit}>
  <svelte:fragment slot="author-et-al">
    <div class="flex gap-4 my-4 px-0 justify-between text-t3">
      <div class="flex gap-8">
        <span class="flex gap-1.5 flex-col max-w-content">
          <span class="text-sm">Owner:</span>
          <Avatar
            url={owner.avatarUrl}
            alt={owner.name}
            size="extra-small"
            withIcon={{
              name: 'check-circle',
              class: submissionsMap[owner.name] ? 'text-accent2-default' : undefined
            }} />
        </span>

        <div class="flex gap-1.5 flex-col max-w-content">
          <span class="text-sm">Participants:</span>

          <div class="flex gap-3">
            {#each otherContributors as { avatarUrl, name }}
              <Avatar
                url={avatarUrl}
                alt={name}
                size="extra-small"
                withIcon={{
                  name: 'check-circle',
                  class: submissionsMap[name] ? 'text-accent2-default' : undefined
                }} />
            {:else}
              --
            {/each}
          </div>
        </div>
      </div>

      <!-- <div>
        <span class="flex gap-1.5 text-sm flex-col max-w-content">
          <span class="">Opened:</span>
          <span class="text-t1">
            {openedAt?.toDateString().replace(/\w{3,3}\s/, '') || '...'}
            <span class="text-t3 text-sm"
              >@ {openedAt?.toLocaleTimeString().replace(/(\d\d:\d\d).*/, '$1') || '...'}</span>
          </span>
        </span>
      </div> -->
    </div>
  </svelte:fragment>

  <div class="grid grid-cols-4 border border-l4 rounded-2xl">
    <div class="flex flex-col gap-2 p-4 border-r border-r-l4">
      <span class="text-t3 text-sm">Total Cost:</span>
      <span class="text-h6-s">$ {data.total_cost || totalCost || 0}</span>
    </div>

    <div class="flex flex-col gap-2 p-4 border-r border-r-l4">
      <span class="text-t3 text-sm">Cycle time:</span>
      <span class="text-h6-s">
        0 <span class="text-t3">hours</span>
      </span>
    </div>

    <div class="flex flex-col gap-2 p-4 border-r border-r-l4">
      <span class="text-t3 text-sm">Rejected:</span>
      <span class="text-h6-s">
        0 <span class="text-t3">times</span>
      </span>
    </div>

    <div class="flex flex-col gap-2 p-4">
      <span class="text-t3 text-sm">Comments:</span>
      <span class="text-h6-s">0</span>
    </div>
  </div>

  <Button class="gap-1" variant="secondary" onClick={() => (showBreakdown = !showBreakdown)}>
    {showBreakdown ? 'Hide' : 'Show'} Breakdown <Icon
      name="chevron-up"
      class="w-5 h-5 transition {!showBreakdown ? 'rotate-180' : ''}" />
  </Button>

  <svelte:fragment slot="breakdown">
    {#if showBreakdown}
      <CostBreakdown data={breakdown} />
    {/if}
  </svelte:fragment>
</PR>
