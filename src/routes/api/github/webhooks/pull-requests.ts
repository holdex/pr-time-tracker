import type { PullRequestEvent } from '$lib/server/github';

export default function parsePullRequestEvents(event: PullRequestEvent) {
  console.log('parsing pull_request_event', event);
}
