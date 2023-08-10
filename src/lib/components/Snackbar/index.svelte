<script lang="ts">
  /** externals */
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';

  /** types */
  import type { IconName, SnackbarStatus } from '../types';

  /** internals */
  import Icon from '$lib/components/Icon/index.svelte';

  /** siblings */
  import { snackbar } from '.';

  /** vars */
  const colors: Record<SnackbarStatus, string> = {
    successful: 'text-accent1-default',
    pending: 'text-current animate-spin',
    failed: 'text-neg'
  };
  let icon: IconName = '';
  let wrapperRef: HTMLElement;
  let status: typeof $snackbar.status = 'successful';

  /** funcs */
  const handleTap = () => {
    $snackbar.open = false;
  };

  /** lifecycles */
  onMount(() => {
    wrapperRef.removeEventListener('click', handleTap);
    wrapperRef.addEventListener('click', handleTap);
  });

  /** react-ibles */
  $: {
    status = $snackbar.status;

    switch (status) {
      case 'pending':
        icon = 'arrow-path';
        break;
      case 'failed':
        icon = 'x-circle';
        break;
      default:
        icon = 'check-circle';
        break;
    }
  }
  $: {
    if (status === 'successful') {
      setTimeout(() => {
        snackbar.update((prev) => ({ ...prev, open: false }));
      }, 4000);
    }
  }
</script>

<div
  bind:this={wrapperRef}
  class={`flex fixed h-0 w-full justify-center items-end px-4 left-0 bottom-8${
    $snackbar.status === 'pending' ? ' text-t3 pointer-events-none' : ''
  }`}>
  {#if $snackbar.open || $snackbar.open === undefined}
    <div
      class="relative right-0 w-max h-fit py-2 px-3 bg-l3 rounded-xl gap-2 flex items-start bottom-0 max-w-full font-semibold border border-l5 shadow-snackbar cursor-pointer"
      transition:fly={{ y: '200%', duration: 350, opacity: 1 }}>
      <Icon name={icon} class={colors[$snackbar.status || 'successful']} />
      <span>{$snackbar.text}</span>
    </div>
  {/if}
</div>
