<script lang="ts">
  /** externals */
  import { page } from '$app/stores';
  import { invalidate } from '$app/navigation';

  /** types */
  import type { User } from '@octokit/webhooks-types';
  import type { ToggleProps } from '../types';

  /** internals */
  import Button from '$lib/components/Button/index.svelte';
  import Toggle from '$lib/components/Toggle/index.svelte';
  import PageTitle from '$lib/components/PageTitle/index.svelte';
  import { invalidations, routes } from '$lib/config';

  /** siblings */
  import { snackbar } from '../Snackbar';
  import Avatar from '../Avatar/index.svelte';

  /** props */
  export let title = 'Home';
  export let archivePath: string | undefined = routes.prsArchive.path;
  export let breadcrumbs: string | undefined = '';
  export let toggle: ToggleProps | undefined = undefined;
  export let activeToggleButton: ToggleProps['activeButton'] = 'left';

  /** vars */
  let user: User;
  let isArchiveRoute = false;
  let isLoading = false;

  /** funcs */
  const onLogout = async () => {
    try {
      isLoading = true;
      $snackbar = { type: 'busy' };
      await fetch('/api/github/auth/logout');
      invalidate(invalidations.user);
      $snackbar = { text: 'Log out successful.', type: 'success' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      $snackbar = { text: e.message || e, type: 'error' };
    } finally {
      isLoading = false;
    }
  };

  /** react-ibles */
  $: user = $page.data.user;
  $: isArchiveRoute = $page.url.pathname.includes('archive');
</script>

<header class="animate-fadeIn">
  <div class="pb-4 flex justify-between border-b border-l3 md:pb-8">
    <div class="flex gap-3 items-center">
      <Avatar url={user.avatar_url} alt={user.name} />
      <span class="text-t3">{user.name}</span>
    </div>

    <Button
      variant="icon"
      iconProps={{ name: 'arrow-right-on-rectangle' }}
      aria-label="Log out"
      class="h-9 w-9"
      {isLoading}
      onClick={onLogout} />
  </div>

  {#if breadcrumbs}
    <span class="text-t3 block my-4 md:my-8">
      {breadcrumbs}
    </span>
  {/if}

  <PageTitle {title} />

  <slot />

  {#if !isArchiveRoute && toggle}
    <div class="flex py-3 justify-between">
      <Toggle
        leftButtonProps={toggle.leftButtonProps}
        rightButtonProps={toggle.rightButtonProps}
        bind:activeButton={activeToggleButton} />

      <Button variant="secondary" text="Archive" href={archivePath} />
    </div>
  {/if}
</header>
