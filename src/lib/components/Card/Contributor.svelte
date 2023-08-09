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
  <div
    class="flex items-center space-x-4 relative border border-solid border-l4 bg-l1 shadow-input rounded-xl text-t1 transition-all list-none dark:bg-l2 xs:w-full"
    style="height: 80px;">
    {#if !avatarFallback}
      <img
        src="https://avatars.githubusercontent.com/u/28790485?v=4"
        alt="Contributor Avatar"
        width="32"
        height="32"
        on:error={handleAvatarError}
        class="w-12 h-12 rounded-full ml-2" />
    {:else}
      <div class="w-12 h-12 bg-gray-300 rounded-full ml-2">
        <p class="text-white text-center text-lg font-bold">S</p>
      </div>
    {/if}
    <div class="flex flex-col space-y-2">
      <span class="text-white text-t3 font-bold"> Sunday Power Inemesit </span>
      <span class="text-t3 font-bold"> power-f-GOD </span>
    </div>
  </div>
</a>
