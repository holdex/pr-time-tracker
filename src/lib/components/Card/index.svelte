<script lang="ts">
  /** externals */

  /** types */
  import type { CardProps } from '../types';

  /** internals */
  import Button from '$lib/components/Button/index.svelte';
  import Toggle from '$lib/components/Toggle/index.svelte';
  import Input from '$lib/components/Input/index.svelte';

  /** props */
  export let isReadonly = false;
  export let isAdmin = false;
  export let loading = false;
  export let data: CardProps['data'] = { hrs: 3, experience: 'Positive', approved: 'Yes' };
  export let onSubmit: CardProps['onSubmit'] = undefined;
</script>

<li
  {...$$restProps}
  class={`Card ${
    $$restProps.class || ''
  } relative border border-solid border-l4 bg-l1 shadow-input rounded-xl text-t1 transition-all list-none dark:bg-l2 xs:w-full`}>
  <div class="p-4 flex gap-4 justify-between items-center">
    <h2 class="text-t3">holdex / holdex-venture-studio / #115</h2>

    <Button
      variant="icon"
      iconProps={{ name: 'github', width: '1.25rem' }}
      class="px-0"
      aria-label="GitHub" />
  </div>

  <p class="p-4 border-y border-l4 text-h4-l font-satoshi">
    Problem: It is hard to upload photos into articles
  </p>

  <form
    class="p-4 text-t3 flex justify-between items-center flex-wrap gap-2 gap-y-4"
    on:submit|preventDefault={async (e) => {
      if (!onSubmit) return;
      loading = true;
      await onSubmit(data)(e);
      loading = false;
    }}>
    <span class="flex gap-1.5 items-center max-w-content">
      <span>Hour:</span>
      {#if isReadonly}
        <span class="text-t1">{data.hrs}</span>
      {:else}
        <Input required min="0.5" bind:value={data.hrs} disabled={loading} />
      {/if}
    </span>

    <span class="flex gap-1.5 items-center sm:mr-auto sm:ml-3">
      <span>Experience:</span>
      {#if isReadonly || isAdmin}
        <span class="text-t1">{data.experience}</span>
      {:else}
        <Toggle isReactionToggle />
      {/if}
    </span>
    {loading}
    {#if !isReadonly}
      <Button
        isSubmitBtn
        size="small"
        text={isAdmin ? `Approv${loading ? 'ing...' : 'e'}` : `Submit${loading ? 'ting...' : ''}`}
        variant={isAdmin ? 'primary' : 'secondary'}
        class="w-full min-w-full sm:min-w-fit"
        disabled={loading} />
    {:else if data.approved && !isAdmin}
      <div class="flex gap-1.5">
        <span>Approved:</span>
        <span class="text-t1">{data.approved}</span>
      </div>
    {/if}
  </form>
</li>
