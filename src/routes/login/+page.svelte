<script lang="ts">
  /*import { goto, invalidate } from '$app/navigation';
  import { invalidations } from '$lib/config';
  import { genAuthUrl } from '$lib/github';
  import type { PageData } from './$types';

  import Button from '$lib/components/Button/index.svelte';*/

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
    <button class="button" on:click|preventDefault={logout} disabled={isRequesting}>Logout</button>
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
    position: absolute
    top: 0
    left: 0
    width: 100%
    height: 100%
    display: flex
    justify-content: center
    align-items: center
    background: rgba(16, 20, 31, 1)
  
  /*.button 
    @apply font-bold font-inter text-blue-700 bg-blue-300 w-156 h-48 px-4 py-2 rounded-12 border-none cursor-pointer transition duration-300 shadow-md*/
  .button
    font-weight: bold
    font-family: "Inter", sans-serif
    font-size: 13.9px
    width: 156px
    height: 48px
    padding: 8px 16px
    border-radius: 12px
    border: none
    cursor: pointer
    box-shadow: 0px 2px 0px 0px rgba(255, 255, 255, 0.24) inset 0px 4px 8px 0px rgba(0, 0, 0, 0.16) 0px 0px 0px 2px rgba(0, 0, 0, 0.2)
    transition: background-color 0.3s
    background: rgba(0, 204, 255, 1)
    color: rgba(16, 20, 31, 1)
  

  /*.button:hover 
    @apply bg-blue-400*/
  .button:hover
    background: rgba(84, 204, 255, 1)
</style>
