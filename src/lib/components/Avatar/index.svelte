<script lang="ts">
  import type { IconProps } from '../types';

  import Icon from '../Icon/index.svelte';

  /** props */
  export let url: string = '';
  export let alt: string = '';
  export let size: 'extra-small' | 'small' | 'medium' = 'small';
  export let withIcon: IconProps | undefined = undefined;

  /** vars */
  let displayAvatarFallback = false || !url;

  /** props type */
  type $$Props = { url?: string; alt?: string; size?: typeof size; withIcon?: IconProps };
</script>

<span
  class="grid place-items-center {size === 'small'
    ? 'w-8 h-8'
    : size === 'extra-small'
    ? 'w-6 h-6'
    : 'w-12 h-12'} relative text-t3">
  <span class="inline-flex w-full h-full rounded-full overflow-clip items-center bg-l3">
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

  {#if withIcon}
    <span
      class="inline-grid w-4 h-4 place-items-center bg-l3 border border-l3 rounded-full absolute -bottom-0.5 -right-2">
      <Icon {...withIcon} class="{withIcon.class} w-full h-full" />
    </span>
  {/if}
</span>
