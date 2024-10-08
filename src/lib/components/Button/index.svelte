<script lang="ts">
  /** types */
  import type { ButtonProps } from '../types';

  /** internals */
  import { appIsReady } from '$lib/utils';

  /** siblings */
  import Content from './content.svelte';

  /** props */
  let className: ButtonProps['class'] = '';
  export { className as class };
  export let text: ButtonProps['text'] = '';
  export let label: ButtonProps['label'] = undefined;
  export let size: ButtonProps['size'] = 'medium';
  export let variant: ButtonProps['variant'] = 'primary';
  export let href: ButtonProps['href'] = undefined;
  export let fixedTo: ButtonProps['fixedTo'] = undefined;
  export let icon: ButtonProps['icon'] = undefined;
  export let iconProps: ButtonProps['iconProps'] = undefined;
  // Used for control DOM element from outside
  export let forwardRef: ButtonProps['forwardRef'] = undefined;
  export let disabled: ButtonProps['disabled'] = false;
  export let isLoading = false;
  export let isSubmitBtn: ButtonProps['isSubmitBtn'] = false;
  export let forwardAction: ButtonProps['forwardAction'] = () => {};
  export let onClick: ButtonProps['onClick'] = undefined;
  export const getRef = () => forwardRef;

  /** funcs */
  const clickHandler = (e?: Event) => {
    if (!disabled && onClick) return onClick(e);
  };

  /** react-ibles */
  $: variantClass = `btn--${variant}`;
  $: sizeClass = `btn--${size}`;
  $: disabledClass = disabled || isLoading || !$appIsReady ? 'btn__disabled' : '';
  $: btnType = isSubmitBtn ? 'submit' : 'button';
  $: iconSize = size === 'small' ? 20 : 24;
  $: btnClass = `btn ${variantClass} ${sizeClass} ${className || ''} ${disabledClass}`;
  $: if (variant === 'icon') {
    $$restProps.title = $$restProps.title || $$restProps['aria-label'] || undefined;
  }

  /** props type */
  type $$Props = ButtonProps;
</script>

{#if href}
  <a
    {...$$restProps}
    use:forwardAction
    disabled={disabled || isLoading}
    style:width!={fixedTo || 'auto'}
    bind:this={forwardRef}
    class="{btnClass} no-underline"
    {href}
    on:click={$appIsReady ? clickHandler : undefined}>
    <Content {icon} {iconSize} {label} {text} {iconProps} {isLoading}>
      <slot />
    </Content>
  </a>
{:else}
  <button
    {...$$restProps}
    use:forwardAction
    disabled={disabled || isLoading || !$appIsReady}
    style:width={fixedTo || 'auto'}
    bind:this={forwardRef}
    class={btnClass}
    type={btnType}
    on:click={clickHandler}>
    <Content {icon} {iconSize} {label} {text} {iconProps} {isLoading}>
      <slot />
    </Content>
  </button>
{/if}

<style lang="scss" src="./index.scss">
</style>
