import type { IssuesEvent } from '$lib/server/github';

export default function parseIssuesEvents(event: IssuesEvent) {
  console.log('parsing issues_event', event);
}
