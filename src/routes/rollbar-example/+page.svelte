<script lang="ts">
  import rollbar from '$lib/rollbar';

  function triggerHandledError() {
    try {
      throw new Error('This is a handled error triggered by a button.');
    } catch (err) {
      rollbar.error('Handled error occurred in RollbarTest.svelte', err as string);
    }
  }

  function triggerUnhandledError() {
    setTimeout(() => {
      throw new Error('This is an unhandled error triggered by a button.');
    }, 0);
  }

  function triggerUnhandledPromiseRejection() {
    new Promise((resolve, reject) => {
      reject('This is an unhandled promise rejection triggered by a button.');
    });
  }
</script>

<p>Click the buttons below to trigger errors.</p>

<button on:click={triggerHandledError}>Trigger Handled Error</button>
<button on:click={triggerUnhandledError}>Trigger Unhandled Error</button>
<button on:click={triggerUnhandledPromiseRejection}>Trigger Unhandled Promise Rejection</button>
