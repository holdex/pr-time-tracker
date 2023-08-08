<script lang="ts">
  /** externals */

  /** types */
  import type { HTMLInputAttributes } from 'svelte/elements';

  /** props */
  export let value: HTMLInputAttributes['value'] = undefined;
  export let onFocus: HTMLInputAttributes['on:focus'] = undefined;
  export let onInput: HTMLInputAttributes['on:input'] = undefined;
  export let onChange: HTMLInputAttributes['on:change'] = undefined;
  export let onBlur: HTMLInputAttributes['on:blur'] = undefined;

  /** vars */
  let hasHClass = false;
  let hasWClass = false;
  let hasAlignmentClass = false;

  /** react-ibles */
  $: hasHClass = /(^|\s)h-/.test($$restProps.class);
  $: hasWClass = /(^|\s)w-/.test($$restProps.class);
  $: hasAlignmentClass = /(^|\s)text-(center|left|right)/.test($$restProps.class);

  /** props type */
  type $$Props = Omit<HTMLInputAttributes, 'on:blur' | 'on:change' | 'on:focus' | 'on:input'> &
    Partial<{
      onFocus: typeof onFocus;
      onInput: typeof onInput;
      onChange: typeof onChange;
      onBlur: typeof onBlur;
    }>;
</script>

<input
  {...$$restProps}
  bind:value
  on:focus={onFocus}
  on:input={onInput}
  on:change={onChange}
  on:blur={onBlur}
  class={`Input ${$$restProps.class || ''}${!hasWClass ? ' w-16' : ''}${!hasHClass ? ' h-8' : ''}${
    !hasAlignmentClass ? ' text-center' : ''
  } relative border border-solid border-l4 bg-l1 shadow-input rounded-xl p-2.25 text-footnote text-t1 transition-all placeholder:text-footnote placeholder:opacity-100 placeholder:text-t3 hover:border-accent1-default focus:border-accent1-default autofill:fill-t1 autofill:hover:text-t3 dark:bg-l2`}
  placeholder={$$restProps.placeholder || 'H'} />
