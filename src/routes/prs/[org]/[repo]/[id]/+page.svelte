<script lang="ts">
  import type { PageData } from './$types';

  import PRs from '$lib/layouts/PRs/index.svelte';
  import PR from '$lib/components/Card/PR.svelte';

  /** props */
  export let data: PageData;
</script>

<PRs prs={[data.pr]} PRCard={PR} />
