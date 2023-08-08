<script lang="ts">
  import { goto, invalidate } from '$app/navigation';

  import type { PageData } from './$types';

  import Icon from '$lib/components/Icon/index.svelte';
  import Toggle from '$lib/components/Toggle/index.svelte';
  import Button from '$lib/components/Button/index.svelte';
  import { invalidations } from '$lib/config';
  import { genAuthUrl } from '$lib/github';

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

<div class="container">
  {#if data.user}
    <p>Hello <b>{data.user.name}</b></p>
    <Button size="large" variant="secondary" onClick={logout} disabled={isRequesting}>
      <Icon name="exclamation-triangle" isOutlined class="mr-2" /> Logout
    </Button>
  {:else}
    <Button size="large" variant="secondary" onClick={loginWithGithub} disabled={isRequesting}>
      <Icon name="exclamation-triangle" isOutlined class="mr-2" /> Log in with Github
    </Button>
  {/if}
</div>

<style lang="sass">
  @tailwind base
  @tailwind components
  @tailwind utilities

  .container 
    position: relative /*position: absolute */
    /*top: 0*/
    /*left: 0*/
    width: 100%
    height: 100vh  /*height: 100%*/
    display: flex
    justify-content: center
    align-items: center
    background: rgba(16, 20, 31, 1)
</style>
