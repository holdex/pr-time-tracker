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

  /** props type */
  type $$Props = Pick<ButtonProps, 'icon' | 'label' | 'text' | 'iconProps'> & { iconSize: number };
</script>

{#if icon || iconProps}
  <Icon
    name={icon || ''}
    width={iconSize}
    height={iconSize}
    colorInherit
    isOutlined={$$restProps.isOutlined}
    {...iconProps} />
{/if}

{#if text || label}
  <span>{text || label}</span>
{/if}

<slot />
