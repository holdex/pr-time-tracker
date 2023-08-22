import type { InstallationEvent } from '$lib/server/github';

export default function parseInstallationEvents(event: InstallationEvent) {
  console.log('parsing installation_event', event);
}
