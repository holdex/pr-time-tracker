<script lang="ts">
  /** Add all icons used throught out the app in this file. Follow the example with the 'exclamation-triangle' below. */
  /** externals */
  import { ExclamationTriangle, HandThumbDown, HandThumbUp } from '@steeze-ui/heroicons';

  /** types */
  import type { IconName, IconProps } from '../types';

  /** siblings */
  import IconSource from './source.svelte';

  /** props */
  export let name: IconName;

  /** props type */
  type $$Props = IconProps;
</script>

{#if name === 'exclamation-triangle'}
  <IconSource {...$$restProps} src={ExclamationTriangle} />
{:else if name === 'hand-thumb-up'}
  <IconSource {...$$restProps} src={HandThumbUp} />
{:else if name === 'hand-thumb-down'}
  <IconSource {...$$restProps} src={HandThumbDown} />
{:else}
  <span />
{/if}
