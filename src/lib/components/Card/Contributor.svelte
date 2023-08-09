<script lang="ts">
  /** vars */
  let avatarFallback = false;

  /** functs */
  const handleAvatarError = () => {
    avatarFallback = true;
  };

  const redirectToContributorDetails = () => {
    return 0;
  };
</script>

<a class="block cursor-pointer" on:click={redirectToContributorDetails}>
  <div class="flex items-center space-x-4">
    {#if !avatarFallback}
      <img
        src="https://avatars.githubusercontent.com/u/28790485?v=4"
        alt="Contributor Avatar"
        width="32"
        height="32"
        on:error={handleAvatarError}
        class="w-12 h-12 rounded-full" />
    {:else}
      <div class="w-12 h-12 bg-gray-300 rounded-full">
        <p class="text-white text-center text-lg font-bold">S</p>
      </div>
    {/if}
    <span class="text-white text-t3 font-bold"> Sunday Power Inemesit </span>
  </div>
</a>
