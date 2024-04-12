<script lang="ts">
  import type { LayoutData } from './$types';

  import Header from '$lib/components/Header/index.svelte';

  /** props */
  export let data: LayoutData;
</script>

<Header title="Pull Request Details" breadcrumbs={undefined} />

<slot />
