<script lang="ts">
  /** deps */
  import { page } from '$app/stores';

  import type { LayoutData } from './$types';

  import Header from '$lib/components/Header/index.svelte';
  import { routes } from '$lib/config';
  import { activeTab } from '$lib/components/Toggle';

  /** props */
  export let data: LayoutData;

  /** vars */
  let isArchiveRoute = false;

  /** react-ibles */
  $: isArchiveRoute = $page.url.pathname.includes('/archive');
</script>

<Header
  title={routes[isArchiveRoute ? 'prsArchive' : 'prs'].title}
  breadcrumbs={isArchiveRoute ? `${routes.prs.title} / Archive` : undefined}
  activeToggleButton={$activeTab.position}
  toggle={{
    leftButtonProps: { text: 'Unsubmitted' },
    rightButtonProps: { text: 'Submitted' }
  }} />

<slot />
