import type { PullRequestReviewEvent } from '$lib/server/github';

export default function parsePullRequestReviewEvents(event: PullRequestReviewEvent) {
  console.log('parsing pull_request_review_event', event);
}
