<script lang="ts">
  /** types */
  import type { ButtonProps, IconProps } from '../types';
  import type { HTMLAttributes } from 'svelte/elements';

  /** siblings */
  import Button from '../Button/index.svelte';

  /** props */
  let className: ButtonProps['class'] = '';
  export { className as class };
  export let leftButtonProps: ButtonProps = {};
  export let rightButtonProps: ButtonProps = {};
  export let activeButton: 'left' | 'right' = 'left';
  export let isReactionToggle = false;

  /** vars */
  const commonClassNames = `toggle-button ${isReactionToggle ? ' !px-2 !py-1' : ''}`;
  const iconProps: IconProps = { name: 'hand-thumb-up', width: '1.125rem', height: '1.125rem' };

  /** funcs */
  const handleToggle = (button: typeof activeButton) => () => {
    activeButton = button;
  };

  /** react-ibles */

  /** props type */
  type $$Props = {
    leftButtonProps?: ButtonProps;
    rightButtonProps?: ButtonProps;
    activeButton?: typeof activeButton;
    isReactionToggle?: boolean;
  } & HTMLAttributes<HTMLSpanElement>;
</script>

<span
  {...$$restProps}
  class={`flex border border-l4 rounded-xl overflow-clip w-fit ${
    isReactionToggle ? 'h-8 shadow-toggle' : ''
  } ${className || ''} hover:border-accent1-default focus-within:border-accent1-default`}>
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
    class={`${commonClassNames} ${activeButton === 'right' ? 'active' : 'text-t3'} rounded-r-lg`}
    onClick={handleToggle('right')}>
    <slot name="content2" />
  </Button>
</span>
