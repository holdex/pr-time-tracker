<script lang="ts">
  import type { PageData } from './$types';

  import PageTitle from '$lib/components/PageTitle/index.svelte';
  import Button from '$lib/components/Button/index.svelte';

  export let data: PageData;
</script>

<PageTitle title="Documentation" showHeading={false} />

<div
  class="prose mx-auto w-full prose-invert prose-headings:font-satoshi prose-headings:font-black">
  <h1>Available Documentation</h1>

  <div class="flex flex-col gap-4 mt-8">
    <div class="border border-l4 rounded-lg p-6 bg-l2">
      <h2 class="mt-0 mb-2">User Commands</h2>
      <p class="text-t3 mb-4">Learn how to use the available commands and features.</p>
      <Button href="/docs/commands" variant="secondary" size="medium">View Commands</Button>
    </div>

    {#if data.isManager}
      <div class="border border-l4 rounded-lg p-6 bg-l2">
        <h2 class="mt-0 mb-2">Manager Commands</h2>
        <p class="text-t3 mb-4">Manager-specific commands and administrative features.</p>
        <Button href="/docs/commands/manager" variant="secondary" size="medium">
          View Manager Commands
        </Button>
      </div>
    {/if}
  </div>
</div>
