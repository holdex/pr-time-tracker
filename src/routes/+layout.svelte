<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/stores';

  import Snackbar from '$lib/components/Snackbar/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/index';
  import { appIsReady } from '$lib/utils';

  onMount(() => {
    $appIsReady = true;
    $snackbar.open = false;
  });
</script>

<div
  class="{$page.url.pathname.includes('login')
    ? 'h-full'
    : ''} p-4 py-8 max-w-container mx-auto md:py-12">
  <slot />

  <Snackbar />
</div>

<style lang="scss" global src="./layout.scss">
</style>
