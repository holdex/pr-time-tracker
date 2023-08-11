<script lang="ts">
  /** internals */
  import type { PageData } from './$types';
  
  import Card from '$lib/components/Card/index.svelte';

  /** vars */
  export let data: PageData;

  console.log('Data.user:', data.user);
</script>

<main class="max-w-container m-auto py-4 animate-fadeIn md:py-8">
  <ul class="grid gap-4 md:gap-8">
    <Card />
    <Card isReadonly />
    <Card isAdmin />
  </ul>

  <!-- for correct work, it is necessary that the user be logged in? -->
  {#if data.user}
    <p>Logged in as: {data.user}</p>
  {:else}
    <p>Not logged in</p>
  {/if}

  <!-- TODO: output data from +page.server.ts -->
</main>
