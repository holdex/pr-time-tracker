<script lang="ts">
  import type { CardProps } from '../../../../lib/components/types';
  import type { Experience } from '$lib/@types';

  import Button from '$lib/components/Button/index.svelte';
  import Icon from '$lib/components/Icon/index.svelte';
  import PR from '$lib/components/Card/PR.svelte';

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

  /** react-ibles */
  $: {
    totalCost = 0;
    breakdown =
      data.contributors?.map(({ id, rate, avatarUrl, name }) => {
        const submission = data.submissions?.find(({ owner_id }) => owner_id === id);
        const cost = Number(((submission?.hours || 0) * rate).toFixed(2));

        totalCost += cost;

        return {
          experience: submission?.experience,
          rate,
          avatarUrl,
          hours: submission?.hours,
          name,
          cost
        };
      }) || [];
  }
  $: openedAt = data.created_at ? new Date(data.created_at) : undefined;
</script>

<PR {isReadonly} {isAdmin} {loading} {data} {onSubmit}>
  <svelte:fragment slot="author-et-al">
    <!-- <div class="flex gap-4 my-4 px-4 justify-between text-t3">
      <div>
        <span class="flex gap-1.5 flex-col max-w-content">
          <span class="text-sm">Author:</span>
          <Avatar url="" alt={data.owner} size="extra-small" />
        </span>
      </div>

      <div>
        <span class="flex gap-1.5 text-sm flex-col max-w-content">
          <span class="">Opened:</span>
          <span class="text-t1">
            {openedAt?.toDateString().replace(/\w{3,3}\s/, '') || '...'}
            <span class="text-t3 text-sm"
              >@ {openedAt?.toLocaleTimeString().replace(/(\d\d:\d\d).*/, '$1') || '...'}</span>
          </span>
        </span>
      </div>
    </div> -->
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
