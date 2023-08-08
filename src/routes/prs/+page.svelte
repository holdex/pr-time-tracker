<script lang="ts">
  /** internals */
  import Card from '$lib/components/Card/index.svelte';

  /** vars */
</script>

<main class="max-w-container m-auto p-4 sm:py-8">
  <ul class="grid gap-4 sm:gap-8">
    <Card />
    <Card isReadonly />
    <Card isAdmin />
  </ul>
</main>
