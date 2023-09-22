<script lang="ts">
  /** deps */
  import { onDestroy, onMount } from 'svelte';

  import type { PageData } from './$types';

  import { snackbar } from '$lib/components/Snackbar';
  import PRs from '$lib/layouts/PRs/index.svelte';
  import { activeTab } from '$lib/components/Toggle';
  import { getPRs } from '$lib/utils';

  import { Approval, type ItemSchema } from '$lib/@types';

  /** props */
  export let data: PageData;

  /** vars */
  const prs: Record<'pending' | 'approved', ItemSchema[]> = {
    pending:
      data.contributor?.prs.filter((pr) => pr.submission?.approval === Approval.PENDING) || [],
    approved: []
  };
  let isApprovedTab = false;

  /** lifecycles */
  onMount(async () => {
    $snackbar.open = !data.contributor;
    if (!data.contributor) return;
    // fetch `submitted` PRs initially since `unsubmitted`s are fetched on server (for faster navigation/load)
    prs.approved = await getPRs({
      submitted: true,
      approvals: [Approval.APPROVED],
      contributor_id: data.contributor.id
    });
  });

  onDestroy(() => ($activeTab.position = 'left'));

  /** react-ibles */
  $: if (!data.contributor && globalThis.history) {
    globalThis.history.back();
    $snackbar = { text: data.message, type: 'error' };
  }
  $: isApprovedTab = $activeTab.position === 'right';
</script>

<PRs
  context="contributor"
  query={{ approvals: isApprovedTab ? [Approval.APPROVED] : [Approval.PENDING], submitted: true }}
  bind:prs={prs[isApprovedTab ? 'approved' : 'pending']} />
