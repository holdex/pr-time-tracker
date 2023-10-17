<script lang="ts">
  import { slide } from 'svelte/transition';

  import Icon from '$lib/components/Icon/index.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';

  import { Experience, type ItemSchema } from '$lib/@types';

  export let pr: ItemSchema;

  let rows: Array<{
    avatarUrl?: string;
    name?: string;
    experience?: Experience;
    rate: number;
    hours?: number;
  }> = [];

  $: rows =
    pr.contributors?.map(({ id, rate, avatarUrl, name }) => {
      const submission = pr.submissions?.find(({ owner_id }) => owner_id === id);

      return {
        experience: submission?.experience,
        rate,
        avatarUrl,
        hours: submission?.hours,
        name
      };
    }) || [];
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
        {#each rows as { avatarUrl: avatar_url, name, experience, rate, hours }, i}
          <tr class={i === rows.length - 1 ? '' : 'border-b border-b-l4'}>
            <td class="border-r border-r-l4 py-1.5 px-2.5">
              <span class="flex justify-between items-center gap-2">
                <span class="inline-flex gap-2 items-center">
                  <Avatar size="extra-small" url={avatar_url} />
                  {name}
                </span>

                {#if experience}
                  <Icon
                    name={experience === Experience.POSITIVE ? 'hand-thumb-up' : 'hand-thumb-down'}
                    class="w-4 h-4" />
                {/if}
              </span>
            </td>
            <td class="border-r border-r-l4 py-1.5 px-2.5">$ {rate} / hr</td>
            <td class="border-r border-r-l4 py-1.5 px-2.5">{hours} hr{hours === 1 ? '' : 's'}</td>
            <td class="px-2.5">$ {((hours || 0) * rate).toFixed(2)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
