<script lang="ts">
  /** types */
  import type { ButtonProps } from '../types';

  /** internals */
  import Icon from '$lib/components/Icon/index.svelte';

  /** props */
  export let text: ButtonProps['text'] = undefined;
  export let icon: ButtonProps['icon'] = undefined;
  export let iconProps: ButtonProps['iconProps'] = undefined;
  export let label: ButtonProps['label'] = undefined;
  export let iconSize: number;
  export let isLoading = false;

  /** props type */
  type $$Props = Pick<ButtonProps, 'icon' | 'label' | 'text' | 'iconProps'> & {
    iconSize: number;
    isLoading?: boolean;
  };
</script>

{#if icon || iconProps}
  <Icon
    width={iconProps?.height || iconSize}
    height={iconProps?.width || iconSize}
    colorInherit
    isOutlined={$$restProps.isOutlined}
    {...iconProps}
    name={isLoading ? 'arrow-path' : iconProps?.name || icon || ''}
    class={`${iconProps?.class || ''}${isLoading ? ' animate-spin' : ''}`} />
{/if}

{#if text || label}
  <span>{text || label}</span>
{/if}

<slot />
