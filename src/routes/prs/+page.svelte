<script lang="ts">
  /** internals */
  import type { CardProps } from '$lib/components/types';

  /** internals */
  import Card from '$lib/components/Card/index.svelte';
  import { snackbar } from '$lib/components/Snackbar';

  /** funcs */
  const onSubmit: CardProps['onSubmit'] = (data) => () => {
    $snackbar = { open: true, text: 'Please, wait...', status: 'pending' };

    return new Promise((resolve) => {
      setTimeout(() => {
        $snackbar = { text: `Done submitting "${data.hrs} hrs" of work.`, status: 'successful' };
        resolve();
      }, 3000);
    });
  };
</script>

<main class="max-w-container m-auto py-4 animate-fadeIn md:py-8">
  <ul class="grid gap-4 md:gap-8">
    <Card {onSubmit} />
    <Card isReadonly />
    <Card isAdmin {onSubmit} />
  </ul>
</main>
