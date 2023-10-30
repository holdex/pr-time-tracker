<script lang="ts">
  import { slide } from 'svelte/transition';

  import Icon from '$lib/components/Icon/index.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';

  import { Experience } from '$lib/@types';

  export let data: Array<{
    avatarUrl?: string;
    name?: string;
    experience?: Experience;
    rate: number;
    hours?: number;
    cost: number | string;
  }> = [];
</script>

<div class="p-4 text-footnote border-b border-b-l4" transition:slide>
  <div class="overflow-auto border border-l4 rounded-2xl">
    <table class="w-full">
      <thead class="font-bold border-b border-b-l4">
        {#each ['Contributors', 'Rate', 'Time', 'Cost'] as title, i}
          <th class="py-1.5 px-2.5 {i === 3 ? '' : 'border-r border-r-l4'}">{title}</th>
        {/each}
      </thead>
      <tbody class="text-t3 bg-l1">
        {#each data as { avatarUrl, name, experience, rate, hours, cost }, i}
          <tr class={i === data.length - 1 ? '' : 'border-b border-b-l4'}>
            <td class="border-r border-r-l4 py-1.5 px-2.5">
              <span class="flex justify-between items-center gap-2">
                <span class="inline-flex gap-2 items-center">
                  <Avatar size="extra-small" url={avatarUrl} />
                  {name}
                </span>

                {#if experience}
                  <Icon
                    name={experience === Experience.POSITIVE ? 'hand-thumb-up' : 'hand-thumb-down'}
                    class="w-4 h-4 {experience === Experience.POSITIVE
                      ? 'text-accent1-default'
                      : 'text-neg'}" />
                {/if}
              </span>
            </td>
            <td class="border-r border-r-l4 py-1.5 px-2.5">$ {rate} / hr</td>
            <td class="border-r border-r-l4 py-1.5 px-2.5"
              >{hours ? `${hours} hr${hours === 1 ? '' : 's'}` : '--'}</td>
            <td class="px-2.5">$ {cost}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
