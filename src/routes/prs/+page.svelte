<script lang="ts">
  /** types */
  import { onDestroy, onMount } from 'svelte';

  import type { PageData } from './$types';

  /** internals */
  import PRs from '$lib/layouts/PRs/index.svelte';
  import type { ItemCollection } from '$lib/server/mongo/operations';
  import { activeTab } from '$lib/components/Toggle';
  import { getPRs } from '$lib/utils';

  /** props */
  export let data: PageData;

  /** vars */
  const prs: Record<'submitted' | 'unsubmitted', ItemCollection[]> = {
    submitted: [],
    unsubmitted: data.prs || []
  };
  let isSubmittedPrs = false;

  /** lifecycles */
  onMount(async () => {
    if (!data.user) return;
    // fetch `submitted` PRs initially since `unsubmitted`s are fetched on server (for faster navigation/load)
    prs.submitted = await getPRs({ submitted: true, owner: data.user.login });
  });

  onDestroy(() => ($activeTab.position = 'left'));

  /** react-ibles */
  $: isSubmittedPrs = $activeTab.position === 'right';
</script>

<PRs
  bind:prs={prs[isSubmittedPrs ? 'submitted' : 'unsubmitted']}
  query={{
    submitted: isSubmittedPrs ? true : undefined
  }} />
