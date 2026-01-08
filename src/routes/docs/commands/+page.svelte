<script lang="ts">
  import CommonDocsPage from '$routes/docs/common-docs-page.svelte';

  import { PageData } from './$types';

  export let data: PageData;
</script>

<CommonDocsPage {data} />
