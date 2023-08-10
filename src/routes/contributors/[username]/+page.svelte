<script lang="ts">
  /** internals */
  import type { PageData } from './$types';
  
  import Card from '$lib/components/Card/index.svelte';

  /** vars */
  export let data: PageData;
</script>

<main class="max-w-container m-auto py-4 animate-fadeIn md:py-8">
  <ul class="grid gap-4 md:gap-8">
    <Card />
    <Card isReadonly />
    <Card isAdmin />
  </ul>

  <h1>{data.post.title}</h1>
  <p>{data.post.content}</p>
  <!-- TODO: output data from +page.server.ts -->
</main>
