<script lang="ts">
  /** externals */
  import { onDestroy, onMount } from 'svelte';

  /** types */
  import type { PageData } from './$types';

  /** internals */
  import { snackbar } from '$lib/components/Snackbar';
  import PRs from '$lib/layouts/PRs/index.svelte';
  import type { ItemCollection } from '$lib/server/mongo/operations';
  import { activeTab } from '$lib/components/Toggle';
  import { ItemState } from '$lib/constants';
  import { getPRs } from '$lib/utils';

  /** props */
  export let data: PageData;

  /** vars */
  const prs: Record<'pending' | 'approved', ItemCollection[]> = {
    pending: data.contributor?.prs || [],
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
      state: ItemState.APPROVED,
      owner: data.contributor.login
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
  query={{ state: isApprovedTab ? ItemState.APPROVED : ItemState.PENDING, submitted: true }}
  bind:prs={prs[isApprovedTab ? 'approved' : 'pending']} />
