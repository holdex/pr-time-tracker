<script lang="ts">
  /** props */
  export let url: string = '';
  export let alt: string = '';
  export let size: 'extra-small' | 'small' | 'medium' = 'small';

  /** vars */
  let displayAvatarFallback = false || !url;

  /** props type */
  type $$Props = { url?: string; alt?: string; size?: typeof size };
</script>

<span
  class="grid place-items-center {size === 'small'
    ? 'w-8 h-8'
    : size === 'extra-small'
    ? 'w-6 h-6'
    : 'w-12 h-12'} bg-l3 rounded-full overflow-clip text-t3">
  {#if !displayAvatarFallback}
    <img
      src={url}
      {alt}
      width={size === 'small' ? '32' : '48'}
      height={size === 'small' ? '32' : '48'}
      on:error={() => (displayAvatarFallback = true)}
      class="object-cover object-center" />
  {:else}
    {(alt[0] || 'a').toUpperCase()}
  {/if}
</span>
