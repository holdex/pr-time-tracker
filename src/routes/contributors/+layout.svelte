<script lang="ts">
  /** externals */
  import { onMount } from 'svelte';

  import { page } from '$app/stores';
  import { preloadCode } from '$app/navigation';

  /** types */
  import type { LayoutData } from './$types';

  /** internals */
  import Header from '$lib/components/Header/index.svelte';
  import { routes } from '$lib/config';
  import type { ContributorSchema } from '$lib/server/mongo/operations';
  import { activeTab } from '$lib/components/Toggle';

  /** props */
  export let data: LayoutData;

  /** vars */
  let isArchiveRoute = false;
  let route = routes.contributors.path;
  let isBaseRoute = true;
  let contributor: ContributorSchema | undefined;

  onMount(() => {
    setTimeout(() => {
      preloadCode('/contributors/*');
    });
  });

  /** react-ibles */
  $: route = $page.url.pathname;
  $: isBaseRoute = route === routes.contributors.path;
  $: isArchiveRoute = route.includes('archive');
</script>

<Header
  title={`${!isBaseRoute ? '' : routes.contributors.title}${
    isBaseRoute
      ? ''
      : `${contributor?.name || $page.params.username}${isArchiveRoute ? ' ⏤ Archive' : ''}`
  }`}
  breadcrumbs={$page.params.username &&
    `Contributors / ${$page.params.username}${isArchiveRoute ? ' / Archive' : ''}`}
  archivePath={`${routes.contributors.path}/${$page.params.username}/archive`}
  activeToggleButton={$activeTab.position}
  toggle={isBaseRoute
    ? undefined
    : {
        leftButtonProps: { text: 'Pending' },
        rightButtonProps: { text: 'Approved' }
      }} />
<slot />
