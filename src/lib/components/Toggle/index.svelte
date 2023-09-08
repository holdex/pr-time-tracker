<script lang="ts">
  /** types */
  import type { ButtonProps, IconProps, ToggleProps } from '../types';

  /** internals */
  import { appIsReady, createEffect } from '$lib/utils';

  /** siblings */
  import Button from '../Button/index.svelte';
  import { activeTab } from '.';

  /** props */
  let className: ButtonProps['class'] = '';
  export { className as class };
  export let leftButtonProps: ButtonProps = {};
  export let rightButtonProps: ButtonProps = {};
  export let isReactionToggle = false;
  export let activeButton: 'left' | 'right' | '' = isReactionToggle ? '' : 'left';

  /** vars */
  const commonClassNames = `toggle-button ${isReactionToggle ? '!px-2 !py-1' : '!px-2.5'}`;
  const iconProps: IconProps = { name: 'hand-thumb-up', width: '1.125rem', height: '1.125rem' };

  /** funcs */
  const useActiveTabEffect = isReactionToggle ? undefined : createEffect();

  const handleToggle = (button: typeof activeButton) => () => {
    activeButton = isReactionToggle && activeButton === button ? '' : button;
  };

  /** react-ibles */
  $: if (useActiveTabEffect) {
    useActiveTabEffect(() => {
      $activeTab = {
        position: activeButton,
        title: String(activeButton === 'left' ? leftButtonProps.text : rightButtonProps.text) || ''
      };
    }, [activeButton]);
  }

  /** props type */
  type $$Props = ToggleProps;
</script>

<span
  {...$$restProps}
  class={`flex border border-l4 rounded-xl overflow-clip w-fit ${
    isReactionToggle ? 'h-8 shadow-toggle' : ''
  } ${className || ''} ${
    $appIsReady ? 'hover:border-accent1-default focus-within:border-accent1-default' : ''
  }`}>
  <Button
    {...leftButtonProps}
    variant={rightButtonProps.variant || 'secondary'}
    iconProps={isReactionToggle ? iconProps : undefined}
    class={`${commonClassNames} ${
      activeButton === 'left' ? 'active' : 'text-t3'
    } rounded-l-lg border-r border-r-l4`}
    onClick={handleToggle('left')}>
    <slot name="content1" />
  </Button>
  <Button
    {...rightButtonProps}
    variant={rightButtonProps.variant || 'secondary'}
    iconProps={isReactionToggle ? { ...iconProps, name: 'hand-thumb-down' } : undefined}
    class={`${commonClassNames} ${
      activeButton === 'right' ? `active${isReactionToggle ? ' !text-neg' : ''}` : 'text-t3'
    } rounded-r-lg`}
    onClick={handleToggle('right')}>
    <slot name="content2" />
  </Button>
</span>
