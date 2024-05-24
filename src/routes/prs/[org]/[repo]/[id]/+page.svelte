<script lang="ts">
  import { invalidate } from '$app/navigation';
  
  import type { PageData } from './$types';
  
  import PRs from '$lib/layouts/PRs/index.svelte';
  import PR from '$lib/components/Card/PR.svelte';
  import { invalidations } from '$lib/config';

  /** props */
  export let data: PageData;
</script>

<PRs prs={[data.pr]} PRCard={PR} onUpdate={() => invalidate(invalidations.user)} />
