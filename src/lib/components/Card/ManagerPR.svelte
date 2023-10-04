<script lang="ts">
  import type { CardProps } from '../types';

  import Avatar from '$lib/components/Avatar/index.svelte';

  import PR from './PR.svelte';

  /** props */
  export let isReadonly = false;
  export let isAdmin = false;
  export let loading = false;
  export let data: CardProps['data'];
  export let onSubmit: CardProps['onSubmit'] = undefined;

  /** vars */
  let openedAt: Date | undefined;

  /** react-ibles */
  $: openedAt = data.created_at ? new Date(data.created_at) : undefined;
</script>

<PR {isReadonly} {isAdmin} {loading} {data} {onSubmit}>
  <svelte:fragment slot="author-et-al">
    <!-- <div class="flex gap-4 my-4 px-4 justify-between text-t3">
      <div>
        <span class="flex gap-1.5 flex-col max-w-content">
          <span class="text-sm">Author:</span>
          <Avatar url="" alt={data.owner} size="extra-small" />
        </span>
      </div>

      <div>
        <span class="flex gap-1.5 text-sm flex-col max-w-content">
          <span class="">Opened:</span>
          <span class="text-t1">
            {openedAt?.toDateString().replace(/\w{3,3}\s/, '') || '...'}
            <span class="text-t3 text-sm"
              >@ {openedAt?.toLocaleTimeString().replace(/(\d\d:\d\d).*/, '$1') || '...'}</span>
          </span>
        </span>
      </div>
    </div> -->
  </svelte:fragment>
</PR>
