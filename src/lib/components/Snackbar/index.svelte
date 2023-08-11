<script lang="ts">
  /** externals */
  import { fly } from 'svelte/transition';
  import { onDestroy, onMount } from 'svelte';

  /** types */
  import type { IconName, SnackbarType } from '../types';

  /** internals */
  import Icon from '$lib/components/Icon/index.svelte';
  import { createEffect } from '$lib/utils';

  /** siblings */
  import { snackbar } from '../Snackbar';

  /** vars */
  const colors: Record<SnackbarType, string> = {
    success: 'text-accent1-default',
    busy: 'text-current animate-spin',
    error: 'text-neg',
    info: 'text-current'
  };
  let icon: IconName = '';
  let wrapperRef: HTMLElement;
  let type: SnackbarType = 'info';
  let hideTimeout: ReturnType<typeof setTimeout>;

  /** funcs */
  const handleTap = () => {
    $snackbar.open = false;
  };

  const useStatusEffect = createEffect();

  /** lifecycles */
  onMount(() => wrapperRef.addEventListener('click', handleTap));

  onDestroy(() => wrapperRef?.removeEventListener('click', handleTap));

  /** react-ibles */
  $: {
    type = $snackbar.type || 'info';

    switch (type) {
      case 'success':
        icon = 'check-circle';
        break;
      case 'busy':
        icon = 'arrow-path';
        break;
      case 'error':
        icon = 'x-circle';
        break;
      default:
        icon = 'information-circle';
        break;
    }
  }
  $: useStatusEffect(() => {
    if (['info', 'success'].includes(type)) {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        snackbar.update((prev) => ({ ...prev, open: false }));
      }, 4000);
    }
  }, [$snackbar.type, $snackbar.open]);
</script>

<div
  bind:this={wrapperRef}
  class={`flex fixed h-0 w-full justify-center items-end px-4 left-0 bottom-8${
    $snackbar.type === 'busy' ? ' text-t3 pointer-events-none' : ''
  }`}>
  {#if $snackbar.open || $snackbar.open === undefined}
    <div
      class="relative right-0 w-max h-fit py-2 px-3 bg-l3 rounded-xl gap-2 flex items-start bottom-0 max-w-full font-semibold border border-l5 shadow-snackbar cursor-pointer"
      transition:fly={{ y: '200%', duration: 350, opacity: 1 }}>
      <Icon name={icon} class={colors[$snackbar.type || 'success']} />
      <span>{$snackbar.text || 'Please, wait...'}</span>
    </div>
  {/if}
</div>
