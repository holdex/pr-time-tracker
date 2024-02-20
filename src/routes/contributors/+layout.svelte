<script lang="ts">
  /** deps */
  import { onMount } from 'svelte';

  import { page } from '$app/stores';
  import { preloadCode } from '$app/navigation';

  import type { LayoutData } from './$types';
  import type { ContributorSchema } from '$lib/@types';

  import Header from '$lib/components/Header/index.svelte';
  import { routes } from '$lib/config';
  import { activeTab } from '$lib/components/Toggle';

  /** props */
  export let data: LayoutData;

  /** vars */
  let contributorName: string | null;
  let contributorId: string;
  let isArchiveRoute = false;
  let route = routes.contributors.path;
  let isBaseRoute = true;
  let contributor: ContributorSchema | undefined;

  onMount(() => setTimeout(() => preloadCode('/contributors/*')));

  /** react-ibles */
  $: {
    contributorName = $page.data.contributor?.name || '...';
    contributorId = $page.params.id;
    route = $page.url.pathname;
  }
  $: isBaseRoute = route === routes.contributors.path;
  $: isArchiveRoute = route.includes('archive');
</script>

<Header
  title={`${!isBaseRoute ? '' : routes.contributors.title}${
    isBaseRoute
      ? ''
      : `${contributor?.name || contributorName}${isArchiveRoute ? ' ⏤ Archive' : ''}`
  }`}
  breadcrumbs={contributorId &&
    `Contributors / ${contributorName}${isArchiveRoute ? ' / Archive' : ''}`}
  archivePath={`${routes.contributors.path}/${contributorId}/archive`}
  activeToggleButton={$activeTab.position}
  toggle={isBaseRoute
    ? undefined
    : {
        leftButtonProps: { text: 'Pending' },
        rightButtonProps: { text: 'Approved' }
      }}>
  <a class="link block mb-4 underline text-accent1-default" href="/prs">Submit costs for my PRs</a>
</Header>
<slot />
