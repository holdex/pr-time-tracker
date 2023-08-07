<script lang="ts">
  /** types */
  import type { ButtonProps } from '../types';

  /** siblings */
  import Button from '$lib/components/Button/index.svelte';

  /** props */
  let className: ButtonProps['class'] = '';
  export { className as class };
  export let leftButtonProps: ButtonProps = {};
  export let rightButtonProps: ButtonProps = {};

  /** funcs */

  /** react-ibles */

  /** props type */
  type $$Props = { leftButtonProps: ButtonProps; rightButtonProps: ButtonProps };
</script>

<div class="flex borde p-3">
  <Button {...leftButtonProps} variant="secondary" class="text-t3 !rounded-none">
    <slot name="content1" />
  </Button>
  <Button {...rightButtonProps} class="">
    <slot name="content2" />
  </Button>
</div>
