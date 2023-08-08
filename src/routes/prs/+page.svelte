<script lang="ts">
  /** internals */
  import Card from '$lib/components/Card/index.svelte';
  import Toggle from '$lib/components/Toggle/index.svelte';

  /** vars */
</script>

<main class="max-w-container m-auto p-4 sm:py-8">
  <div class="grid gap-4 sm:gap-8">
    <Toggle leftButtonProps={{ text: 'Unsubmitted' }} rightButtonProps={{ text: 'Submitted' }} />
    <Toggle isReactionToggle />
    <div />
    <ul class="grid gap-4 sm:gap-8">
      <Card />
      <Card isReadonly />
      <Card isAdmin />
    </ul>
  </div>
</main>
