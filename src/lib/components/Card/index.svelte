<script lang="ts">
  /** externals */

  /** types */
  import type { HTMLAttributes } from 'svelte/elements';

  /** internals */
  import Button from '$lib/components/Button/index.svelte';
  import Toggle from '$lib/components/Toggle/index.svelte';
  import Input from '$lib/components/Input/index.svelte';

  /** props */
  export let isReadonly = false;
  export let isAdmin = false;
  export let data = { hrs: 3, experience: 'Positive', approved: 'Yes' };

  /** props type */
  type $$Props = HTMLAttributes<HTMLLIElement> &
    Partial<{ isReadonly: boolean; isAdmin: boolean; data: typeof data }>;
</script>

<li
  {...$$restProps}
  class={`Card ${
    $$restProps.class || ''
  } relative border border-solid border-l4 bg-l1 shadow-input rounded-xl text-t1 transition-all list-none dark:bg-l2 xs:w-full`}>
  <div class="p-4 flex gap-4 justify-between items-center">
    <h2 class="text-t3">holdex / holdex-venture-studio / #115</h2>

    <Button variant="icon" iconProps={{ name: 'github', width: '1.25rem' }} class="px-0" />
  </div>

  <p class="p-4 border-y border-l4 text-h4-l font-satoshi">
    Problem: It is hard to upload photos into articles
  </p>

  <div class="p-4 text-t3 flex justify-between items-center flex-wrap gap-2 gap-y-4">
    <span class="flex gap-1.5 items-center max-w-content">
      <span>Hour:</span>
      {#if isReadonly}
        <span class="text-t1">{data.hrs}</span>
      {:else}
        <Input />
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

    {#if !isReadonly}
      <Button
        size="small"
        text={isAdmin ? 'Approve' : 'Submit'}
        variant={isAdmin ? 'primary' : 'secondary'}
        class="w-full min-w-full sm:min-w-fit" />
    {:else if data.approved && !isAdmin}
      <div class="flex gap-1.5">
        <span>Approved:</span>
        <span class="text-t1">{data.approved}</span>
      </div>
    {/if}
  </div>
</li>
