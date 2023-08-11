<script lang="ts">
  /** props */
  export let url: string;
  export let alt: string = '';
  export let size: 'small' | 'medium' = 'small';

  /** vars */
  let displayAvatarFallback = false;

  /** props type */
  type $$Props = { url: string; alt?: string; size?: typeof size };
</script>

<span
  class="grid place-items-center {size === 'small'
    ? 'w-8 h-8'
    : 'w-12 h-12'} bg-l3 rounded-full overflow-clip text-t3">
  {#if !displayAvatarFallback}
    <img
      src={url}
      {alt}
      width="32"
      height="32"
      on:error={() => (displayAvatarFallback = true)}
      class="object-cover object-center" />
  {:else}
    {alt[0] || 'A'}
  {/if}
</span>
