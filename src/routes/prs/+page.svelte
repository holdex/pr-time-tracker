<script lang="ts">
  /** internals */
  import Card from '$lib/components/Card/index.svelte';
  import Toggle from '$lib/components/Toggle/index.svelte';
  import Button from '$lib/components/Button/index.svelte';

  /** vars */

  /** funcs */
  const forTest = async () => {
    return 0;
  };
</script>

<main class="max-w-container m-auto p-4 sm:py-8">
  <div class="grid gap-4 sm:gap-8">
    <div class="text-h3-l">
      <p>Your Closed Pull Requests</p>
    </div>
    <div class="flex justify-between">
      <Toggle leftButtonProps={{ text: 'Unsubmitted' }} rightButtonProps={{ text: 'Submitted' }} />
      <div class="w-120">
        <Button size="large" variant="secondary" onClick={forTest} disabled={true}>Archive</Button>
      </div>
    </div>
    <div>
      <ul class="grid gap-4 sm:gap-8">
        <Card />
        <Card isReadonly />
        <Card isAdmin />
      </ul>
    </div>
  </div>
</main>
