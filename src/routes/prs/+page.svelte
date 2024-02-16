<script lang="ts">
  /** deps */
  import { onDestroy, onMount } from 'svelte';

  import type { PageData } from './$types';
  import type { ItemSchema } from '$lib/@types';

  import PRs from '$lib/layouts/PRs/index.svelte';
  import { activeTab } from '$lib/components/Toggle';
  import { getPRs } from '$lib/utils';
  import PR from '$lib/components/Card/PR.svelte';

  /** props */
  export let data: PageData;

  /** vars */
  const prs: Record<'submitted' | 'unsubmitted', ItemSchema[]> = {
    submitted: [],
    unsubmitted: data.prs?.filter((pr) => !pr.submission) || []
  };
  let isSubmittedPrs = false;

  /** lifecycles */
  onMount(async () => {
    if (!data.user) return;
    // fetch `submitted` PRs initially since `unsubmitted`s are fetched on server (for faster navigation/load)
    prs.submitted = await getPRs({ submitted: true, contributor_id: data.user.id });
  });

  onDestroy(() => ($activeTab.position = 'left'));

  /** react-ibles */
  $: isSubmittedPrs = $activeTab.position === 'right';
</script>

<PRs
  bind:prs={prs[isSubmittedPrs ? 'submitted' : 'unsubmitted']}
  query={{ submitted: isSubmittedPrs }}
  PRCard={PR} />
