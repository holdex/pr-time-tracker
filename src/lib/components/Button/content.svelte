<script lang="ts">
  /** types */
  import type { ButtonProps } from '../types';

  /** internals */
  import Icon from '$lib/components/Icon/index.svelte';

  /** props */
  export let text: ButtonProps['text'] = '';
  export let icon: ButtonProps['icon'] = undefined;
  export let label: ButtonProps['label'] = undefined;
  export let iconSize: number;

  $: console.log({ text });

  /** props type */
  type $$Props = Pick<ButtonProps, 'icon' | 'label' | 'text'> & { iconSize: number };
</script>

<template lang="pug">
  if icon
    <Icon name={icon} width={iconSize} height={iconSize} colorInherit isOutlined={$$restProps.isOutlined} />

  span {text || label || ''}

  slot</template>
