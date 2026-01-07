<script lang="ts">
  export let title = 'Home';
  export let showHeading = true;
</script>

<svelte:head>
  <title>PR Time Tracker | {title}</title>
</svelte:head>

{#if showHeading}
  <h1 class="text-h3-l my-4 font-satoshi md:my-8">
    {title}
  </h1>
{/if}
