<script lang="ts">
  /** externals */

  /** types */
  import type { CardProps, ToggleProps } from '../types';

  /** internals */
  import Button from '$lib/components/Button/index.svelte';
  import Toggle from '$lib/components/Toggle/index.svelte';
  import Input from '$lib/components/Input/index.svelte';

  import { snackbar } from '../Snackbar';

  /** props */
  export let isReadonly = false;
  export let isAdmin = false;
  export let loading = false;
  export let data: CardProps['data'];
  export let onSubmit: CardProps['onSubmit'] = undefined;

  /** vars */
  let activeReactionButton: ToggleProps['activeButton'] = !data.experience
    ? ''
    : data.experience === 'negative'
    ? 'right'
    : 'left';

  /** react-ibles */
  $: if (data.approved && !isAdmin) isReadonly = true;
  $: data.number = Number(data.url?.split('/').slice(-1));
</script>

<li
  {...$$restProps}
  class={`Card ${
    $$restProps.class || ''
  } relative border border-solid border-l4 bg-l1 shadow-input rounded-xl text-t1 transition-all list-none dark:bg-l2 xs:w-full`}>
  <div class="p-4 flex gap-4 justify-between items-center">
    <a
      href={data.url.replace(/.*\/repos/, 'https://github.com').replace('pulls', 'pull')}
      target="_blank"
      class="link">
      <h2 class="text-t3">{data.org} / {data.repo} / #{data.number}</h2>
    </a>

    <Button
      variant="icon"
      iconProps={{ name: 'github', width: '1.25rem' }}
      class="px-0"
      aria-label="GitHub" />
  </div>

  <p class="p-4 border-y border-l4 text-h4-l font-satoshi">Problem: [Placeholder]</p>

  <form
    class="p-4 text-t3 flex justify-between items-center flex-wrap gap-2 gap-y-4"
    on:submit|preventDefault={async (e) => {
      if (!onSubmit) return;

      if (!activeReactionButton) {
        return ($snackbar = {
          text: `Please, rate your experience with #${data.number}.`,
          type: 'info'
        });
      }

      data.experience = activeReactionButton === 'left' ? 'positive' : 'negative';
      loading = true;
      await onSubmit(data)(e);
      data.submitted = true;
      loading = false;
      isReadonly = Boolean(data.approved);
    }}>
    <span class="flex gap-1.5 items-center max-w-content">
      <span>Hours:</span>
      {#if isReadonly}
        <span class="text-t1">{data.hours}</span>
      {:else}
        <Input required min="0.5" bind:value={data.hours} disabled={loading} />
      {/if}
    </span>

    <span class="flex gap-1.5 items-center sm:ml-3 {isReadonly ? 'sm:mr-auto' : ''}">
      <span>Experience:</span>
      {#if isReadonly || isAdmin}
        <span class="capitalize {data.experience === 'negative' ? 'text-neg' : 'text-t1'}">
          {data.experience}
        </span>
      {:else}
        <Toggle isReactionToggle bind:activeButton={activeReactionButton} />
      {/if}
    </span>

    {#if !isAdmin && data.submitted}
      <div class="flex gap-1.5">
        <span>Approved:</span>
        <span class="text-t1 capitalize">{data.approved || 'Pending'}</span>
      </div>
    {/if}
    {#if !isReadonly}
      <Button
        isSubmitBtn
        size="small"
        text={isAdmin
          ? `Approv${loading ? 'ing...' : 'e'}`
          : `${data.submitted ? 'Re-' : ''}Submit${loading ? 'ting...' : ''}`}
        variant={isAdmin ? 'primary' : 'secondary'}
        class="w-full min-w-full ml-auto sm:min-w-fit"
        disabled={loading} />
    {/if}
  </form>
</li>
