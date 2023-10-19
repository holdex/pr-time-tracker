<script lang="ts">
  /** deps */
  import { page } from '$app/stores';

  import type { CardProps, ToggleProps } from '../types';

  import Button from '$lib/components/Button/index.svelte';
  import Toggle from '$lib/components/Toggle/index.svelte';
  import Input from '$lib/components/Input/index.svelte';
  import Icon from '$lib/components/Icon/index.svelte';

  import { snackbar } from '../Snackbar';

  import { Approval, Experience, type SubmissionSchema } from '$lib/@types';

  /** props */
  export let isReadonly = false;
  export let isAdmin = false;
  export let loading = false;
  export let data: CardProps['data'];
  export let onSubmit: CardProps['onSubmit'] = undefined;

  /** vars */
  const href = data.url.replace(/.*\/repos/, 'https://github.com').replace('pulls', 'pull');
  let submissionPayload: Partial<SubmissionSchema> = data.submission || {};
  let submissionApproved = false;
  let activeReactionButton: ToggleProps['activeButton'] = !data.submission?.experience
    ? ''
    : data.submission?.experience === 'negative'
    ? 'right'
    : 'left';
  let closedAndNotMerged = false;
  let closedAt: Date | undefined;

  /** react-ibles */
  $: closedAndNotMerged = !!data.closed_at && !data.merged;
  $: submissionApproved = data.submission?.approval === Approval.APPROVED;
  $: if (submissionApproved && !isAdmin) isReadonly = true;
  $: data.number = Number(data.url?.split('/').slice(-1));
  $: closedAt = data.closed_at ? new Date(data.closed_at) : undefined;
</script>

<li
  {...$$restProps}
  class={`Card ${
    $$restProps.class || ''
  } max-w-full relative border border-solid border-l4 bg-l1 shadow-input rounded-xl text-t1 transition-all list-none animate-fadeIn  ${
    (submissionApproved && !isAdmin) || closedAndNotMerged ? 'opacity-70' : ''
  } dark:bg-l2 xs:w-full`}>
  <div class="p-4 flex gap-4 items-center">
    <span title={data.merged ? 'Closed' : 'Open'}>
      <Icon
        name="pr-{data.merged ? 'closed' : 'open'}"
        class="w-5 h-5 min-w-fit {closedAndNotMerged
          ? 'text-neg'
          : !data.merged
          ? 'text-accent2-default'
          : ''}" />
    </span>

    <a {href} target="_blank" class="link">
      <h2 class="text-t3">{data.org} / {data.repo} / #{data.number}</h2>
    </a>

    {#if closedAt}
      <span class="flex gap-1.5 text-sm ml-auto max-w-content">
        <span class="text-t3">Closed:</span>
        <span class="text-footnote">
          {closedAt.toDateString().replace(/\w{3,3}\s/, '') || '...'}
        </span>
      </span>
    {/if}
  </div>

  <div class="flex flex-col gap-4 p-4 border-y border-l4">
    <p class="text-h4-l font-satoshi">
      {data.title}
    </p>

    <slot name="author-et-al" />
    <slot />
  </div>

  <slot name="breakdown" />

  <form
    class="px-4 my-4 text-t3 flex justify-between items-center flex-wrap gap-2 gap-y-4"
    name={data.title}
    on:submit|preventDefault={async (e) => {
      if (!onSubmit) return;

      if (!activeReactionButton) {
        return ($snackbar = {
          text: `Please, rate your experience with #${data.number}.`,
          type: 'info'
        });
      }

      submissionPayload.owner_id = $page.data.user.id;
      submissionPayload.item_id = data.id;
      submissionPayload.experience =
        Experience[activeReactionButton === 'left' ? 'POSITIVE' : 'NEGATIVE'];
      loading = true;

      if (isAdmin) {
        submissionPayload.approval = submissionApproved ? Approval.PENDING : Approval.APPROVED;
      }

      const result = await onSubmit(
        submissionPayload,
        Number(data.number),
        isAdmin
          ? submissionPayload.approval === data.submission?.approval
          : Boolean(data.submission)
      )(e);

      if (result) {
        submissionPayload = result;
        data.submission = result;
      }

      loading = false;
      isReadonly = data.submission?.approval === Approval.APPROVED;
    }}>
    {#if !isAdmin}
      <span class="flex gap-1.5 items-center max-w-content">
        <span>Hours:</span>
        {#if isReadonly}
          <span class="text-t1">{data.submission?.hours || '...'}</span>
        {:else}
          <Input
            required
            min="0.5"
            bind:value={submissionPayload.hours}
            disabled={loading || isAdmin} />
        {/if}
      </span>

      <span class="flex gap-1.5 items-center sm:ml-3 {isReadonly ? 'sm:mr-auto' : ''}">
        <span>Experience:</span>
        {#if isReadonly}
          <span
            class="capitalize {data.submission?.experience === 'negative'
              ? 'text-neg'
              : 'text-t1'}">
            {data.submission?.experience || '...'}
          </span>
        {:else}
          <Toggle isReactionToggle bind:activeButton={activeReactionButton} />
        {/if}
      </span>

      {#if data.submission}
        <div class="flex gap-1.5">
          <span>Approval:</span>
          <span class="text-t1 capitalize">{data.submission.approval || '...'}</span>
        </div>
      {/if}
    {/if}

    {#if !isReadonly || isAdmin}
      <Button
        isSubmitBtn
        size="small"
        text={isAdmin
          ? `${submissionApproved ? 'Disapprov' : 'Approv'}${loading ? 'ing...' : 'e'}`
          : `${data.submission ? 'Re-' : ''}Submit${loading ? 'ting...' : ''}`}
        variant={isAdmin ? (submissionApproved ? 'secondary' : 'primary') : 'secondary'}
        class="w-full min-w-full ml-auto {submissionApproved && !loading
          ? '!text-neg'
          : ''} sm:min-w-fit"
        disabled={loading || !data.merged || (isAdmin && !data.submission)} />
    {/if}
  </form>
</li>
