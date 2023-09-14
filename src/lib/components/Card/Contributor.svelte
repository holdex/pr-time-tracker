<script lang="ts">
  /** externals */
  import { onMount } from 'svelte';

  import { preloadData } from '$app/navigation';

  /** internals */
  import Avatar from '$lib/components/Avatar/index.svelte';

  /** siblings */
  import { snackbar } from '../Snackbar';

  /** props */
  export let name = '';
  export let avatar_url = '';
  export let id = -1;
  export let username = '';

  /** lifecycles */
  // See this comment, https://github.com/holdex/autoinvoice/pull/145#discussion_r1325465390, for why this is preloaded.
  onMount(() => preloadData(`/contributors/${id}`));
</script>

<li>
  <a
    href="/contributors/{id}"
    class="flex items-center p-4 gap-4 relative border border-solid border-l4 bg-l1 shadow-input rounded-xl text-t1 transition-all list-none animate-fadeIn dark:bg-l2 xs:w-full hover:scale-102.5 focus:scale-105"
    data-sveltekit-preload-data="off"
    on:click={() => ($snackbar = { open: true, text: '', type: 'busy' })}>
    <Avatar url={avatar_url} alt={name} size="medium" />
    <div class="grid">
      <span class="text-white font-semibold">{name || username}</span>
      <span class="text-t3">{username}</span>
    </div>
  </a>
</li>
