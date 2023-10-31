<script>
  import { slide } from 'svelte/transition';

  import Icon from '$lib/components/Icon/index.svelte';

  import { Experience } from '$lib/@types';

  const rows = [
    { name: 'John Doe', experience: Experience.POSITIVE, rate: 150, time: 4.5 },
    { name: 'Jane Doe', rate: 120, time: 0.5 },
    { name: 'Mike Smith', experience: Experience.NEGATIVE, rate: 50, time: 3 },
    { name: 'Joey Smith', rate: 70, time: 2 }
  ];
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
        {#each rows as { name, experience, rate, time }, i}
          <tr class={i === rows.length - 1 ? '' : 'border-b border-b-l4'}>
            <td class="border-r border-r-l4 py-1.5 px-2.5">
              <span class="flex justify-between items-center gap-2">
                {name}
                {#if experience}
                  <Icon
                    name={experience === Experience.POSITIVE ? 'hand-thumb-up' : 'hand-thumb-down'}
                    class="w-4 h-4" />
                {/if}
              </span>
            </td>
            <td class="border-r border-r-l4 py-1.5 px-2.5">$ {rate} / hr</td>
            <td class="border-r border-r-l4 py-1.5 px-2.5">{time} hr{time === 1 ? '' : 's'}</td>
            <td class="px-2.5">$ {(time * rate).toFixed(2)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
