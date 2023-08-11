<script lang="ts">
  import { page } from '$app/stores';

  import Snackbar from '$lib/components/Snackbar/index.svelte';
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
