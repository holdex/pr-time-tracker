<script lang="ts">
  import { onMount } from 'svelte';

  import type { PageData } from './$types';

  import PageTitle from '$lib/components/PageTitle/index.svelte';

  export let data: PageData;

  let contentElement: HTMLDivElement;

  onMount(() => {
    const element = contentElement;
    if (!element) return;

    const handleClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const button = target.closest<HTMLButtonElement>('.code-block__copy');
      if (!button) return;

      const encoded = button.dataset.code;
      if (!encoded) return;

      const text = decodeURIComponent(encoded);

      await navigator.clipboard.writeText(text);
      const originalLabel = button.textContent ?? 'Copy';
      button.textContent = 'Copied!';
      const DELAY = 1500;
      setTimeout(() => {
        button.textContent = originalLabel;
      }, DELAY);
    };

    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('click', handleClick);
    };
  });
</script>

<PageTitle title={data.title || 'Manager Commands'} showHeading={false} />

<div bind:this={contentElement} class="markdown-content">
  {@html data.content}
</div>
