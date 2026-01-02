<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/stores';

  import Snackbar from '$lib/components/Snackbar/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/index';
  import { appIsReady } from '$lib/utils';

  import css from './layout.scss?inline';

  onMount(() => {
    $appIsReady = true;
    $snackbar.open = false;
  });
</script>

<div
  class="{$page.url.pathname.includes('login') ? 'h-full' : ''} {$page.url.pathname.startsWith(
    '/docs'
  )
    ? 'max-w-none'
    : 'max-w-container'} p-4 py-8 mx-auto md:py-12">
  <slot />

  <Snackbar />
</div>

<svelte:element this="style">
  {css}
</svelte:element>
