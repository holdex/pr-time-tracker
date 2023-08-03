<script lang="ts">
  import { goto, invalidate } from '$app/navigation';
  import { invalidations } from '$lib/config';
  import { genAuthUrl } from '$lib/github';
  import type { PageData } from './$types';

  export let data: PageData;

  let isRequesting = false;
  const loginWithGithub = async () => {
    isRequesting = true;
    return goto(genAuthUrl());
  };

  const logout = async () => {
    isRequesting = true;
    return fetch('/api/github/auth/logout')
      .then((r) => r.json())
      .then(() => {
        isRequesting = false;
        invalidate(invalidations.user);
      })
      .catch(() => {
        isRequesting = false;
      });
  };
</script>

<h1>Welcome to SvelteKit</h1>
<p>
  Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>
{#if data.user}
  <p>Hello <b>{data.user.name}</b></p>
  <button on:click|preventDefault={logout} disabled={isRequesting}>Logout</button>
{:else}
  <button on:click|preventDefault={loginWithGithub} disabled={isRequesting}
    >Log in with Github</button>
{/if}
