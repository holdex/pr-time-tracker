<script lang="ts">
  import Button from '$lib/components/Button/index.svelte';
  import rollbar from '$lib/rollbar';

  let disabled = false;

  function triggerHandledError() {
    disabled = true;
    try {
      setTimeout(() => {
        disabled = false;
      }, 300);
      throw new Error('This is a handled error triggered by a button.');
    } catch (err) {
      setTimeout(() => {
        disabled = false;
      }, 300);
      rollbar.error('Handled error occurred in RollbarTest.svelte', err as string);
    }
  }

  function triggerUnhandledError() {
    disabled = true;
    setTimeout(() => {
      disabled = false;
      throw new Error('This is an unhandled error triggered by a button.');
    }, 300);
  }

  function triggerUnhandledPromiseRejection() {
    disabled = true;
    new Promise((resolve, reject) => {
      reject('This is an unhandled promise rejection triggered by a button.');
      setTimeout(() => {
        disabled = false;
      }, 300);
    });
  }
</script>

<p>Click the buttons below to trigger errors.</p>

<div class="space-y-4">
  <Button variant="primary" {disabled} onClick={triggerHandledError}>Trigger Handled Error</Button>
  <Button variant="secondary" {disabled} onClick={triggerUnhandledError}
    >Trigger Unhandled Error</Button>
  <Button variant="solo" {disabled} onClick={triggerUnhandledPromiseRejection}
    >Trigger Unhandled Promise Rejection</Button>
</div>
