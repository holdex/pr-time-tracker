<script lang="ts">
  /** types */
  import type { IconSouceProps } from '../types';

  /** props */
  let className: IconSouceProps['class'] = '';
  export { className as class };
  export let src: IconSouceProps['src'];
  export let width: IconSouceProps['width'] = 24;
  export let height: IconSouceProps['height'] = 24;
  export let isOutlined = false;
  export let colorInherit = false;

  /** vars */
  const iconSrc = src[isOutlined ? 'default' : 'solid'];

  /** props type */
  type $$Props = IconSouceProps;
</script>

<svg
  class="icon inline-flex relative {className}"
  class:icon-outline={isOutlined}
  class:color-inherited={colorInherit}
  {...iconSrc?.a}
  {...$$restProps}
  {width}
  {height}>
  {#each iconSrc?.path ?? [] as a}
    <path {...a} />
  {/each}
  {#each iconSrc?.rect ?? [] as a}
    <rect {...a} />
  {/each}
  {#each iconSrc?.circle ?? [] as a}
    <circle {...a} />
  {/each}
  {#each iconSrc?.polygon ?? [] as a}
    <polygon {...a} />
  {/each}
  {#each iconSrc?.polyline ?? [] as a}
    <polyline {...a} />
  {/each}
  {#each iconSrc?.line ?? [] as a}
    <line {...a} />
  {/each}
</svg>

<style lang="sass">
    .icon-outline.color-inherited path
        stroke: currentColor
        fill: unset

    .color-inherited path
        fill: currentColor
</style>
