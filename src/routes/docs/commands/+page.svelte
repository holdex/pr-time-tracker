<script lang="ts">
  import type { PageData } from './$types';

  import CommonDocsPage from '../common-docs-page.svelte';

  export let data: PageData;
</script>

<CommonDocsPage {data} />
