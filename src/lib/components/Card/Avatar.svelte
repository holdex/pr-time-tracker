<script lang="ts">
  /** internals */
  import Button from '$lib/components/Button/index.svelte';
  import Toggle from '$lib/components/Toggle/index.svelte';
  /** vars */
  let displayAvatarFallback = false;
  /** functs */
  const handleAvatarError = () => {
    displayAvatarFallback = true;
  };
</script>

<header>
  <div class="pb-4 flex justify-between border-b border-l3 md:pb-8">
    <div class="flex gap-3 items-center">
      <span class="grid place-items-center w-8 h-8 bg-l3 rounded-full overflow-clip text-t3">
        {#if displayAvatarFallback}
          <img
            src="https://avatars.githubusercontent.com/u/28790485?v=4"
            alt="Avatar"
            width="32"
            height="32"
            on:error={handleAvatarError}
            class="object-cover object-center" />
        {:else}
          <div class="w-12 h-12 bg-gray-300 rounded-full">
            <p class="text-white text-center text-lg font-bold">S</p>
          </div>
        {/if}
      </span>

      <span class="text-t3">Sunday Power Inemesit</span>
    </div>

    <Button variant="icon" iconProps={{ name: 'arrow-right-on-rectangle' }} aria-label="Log out" />
  </div>
</header>
