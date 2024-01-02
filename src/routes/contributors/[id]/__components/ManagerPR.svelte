<script lang="ts">
  import type { CardProps } from '$lib/components/types';
  import type { ContributorSchema, Experience, SubmissionSchema } from '$lib/@types';

  import Button from '$lib/components/Button/index.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import Icon from '$lib/components/Icon/index.svelte';
  import PR from '$lib/components/Card/PR.svelte';
  import { computeCycleTime, createEffect } from '$lib/utils';

  import CostBreakdown from './CostBreakdown.svelte';

  /** props */
  export let isReadonly = false;
  export let isAdmin = false;
  export let loading = false;
  export let data: CardProps['data'];
  export let onSubmit: CardProps['onSubmit'] = undefined;

  /** vars */
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
  let owner: ContributorSchema | undefined = undefined;
  let otherContributors: ContributorSchema[] = [];
  const submissionsMap: Record<string, SubmissionSchema | undefined> = {};
  const summary = [
    { title: 'Total Cost', primary: '', secondary: '' },
    { title: 'Cycle Time', primary: '', secondary: 'hours' },
    { title: 'Rejected', primary: '0', secondary: 'times' },
    { title: 'Comments', primary: '0' }
  ];

  /** funcs */
  const useSubmissionEffect = createEffect();

  /** react-ibles */
  $: useSubmissionEffect(
    () => {
      totalCost = 0;
      otherContributors = [];
      breakdown =
        data.contributors?.map((contributor) => {
          const { id, rate, avatarUrl, name, login } = contributor;
          const submission = data.submissions?.find(({ owner_id }) => owner_id === id);
          const cost = Number(
            ((submission?.hours || 0) * (submission?.rate || rate || 0)).toFixed(2)
          );

          totalCost += cost;
          if (name === data.owner) owner = contributor;
          else otherContributors.push(contributor);
          submissionsMap[name] = submission;

          return {
            experience: submission?.experience,
            rate,
            avatarUrl,
            hours: submission?.hours,
            name: name || login,
            cost
          };
        }) || [];
      summary[0].primary = `$ ${totalCost}`;
      summary[1].primary = computeCycleTime(data.created_at, data.closed_at);
    },
    [data.submissions?.length],
    true
  );
</script>

<PR {isReadonly} {isAdmin} {loading} {data} {onSubmit}>
  <svelte:fragment slot="author-et-al">
    <div class="flex gap-4 my-4 px-0 justify-between text-t3">
      <div class="flex gap-8">
        <span class="flex gap-1.5 flex-col max-w-content">
          <span class="text-sm">Owner:</span>
          {#if owner}
            <Avatar
              url={owner.avatarUrl}
              alt={owner.name || owner.login}
              size="extra-small"
              withIcon={{
                name: 'check-circle',
                class: submissionsMap[owner.name] ? 'text-accent2-default' : undefined
              }} />
          {:else}
            --
          {/if}
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
    </div>
  </svelte:fragment>

  <div class="grid grid-cols-2 border border-l4 rounded-2xl sm:flex">
    {#each summary as { title, primary, secondary }, i}
      <div
        class="flex flex-col grow gap-2 p-2.5 border-l-l4 {i !== 0
          ? `${i === 2 ? 'sm:border-l' : 'border-l'}`
          : ''} w-fit sm:p-4">
        <span class="text-t3 text-sm truncate">{title}:</span>
        <span class="text-h6-s">
          {primary} <span class="text-t3">{secondary || ''}</span>
        </span>
      </div>
    {/each}
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
