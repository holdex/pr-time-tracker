<script lang="ts">
  import type { PageData } from './$types';

  import PageTitle from '$lib/components/PageTitle/index.svelte';

  export let data: PageData;

  let contentElement: HTMLDivElement;
</script>

<PageTitle title={data.title || 'Manager Commands'} showHeading={false} />

<div bind:this={contentElement} class="markdown-content">
  {@html data.content}
</div>
