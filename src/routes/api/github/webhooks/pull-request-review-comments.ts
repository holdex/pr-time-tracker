import type { PullRequestReviewCommentEvent, SimplePullRequest } from '$lib/server/github';
import { Collections } from '$lib/server/mongo/operations';

import { getContributorInfo, getPrInfo, upsertDataToDB } from './util';

export default async function parsePullRequestReviewCommentEvents(
  event: PullRequestReviewCommentEvent
) {
  const { action, pull_request, repository, organization, sender } = event;

  switch (action) {
    case 'created': {
      const contributorInfo = getContributorInfo(sender);

      const contributorRes = await upsertDataToDB(Collections.CONTRIBUTORS, contributorInfo);
      console.log(
        'Contributor of the PR has been updated in DB successfully.',
        contributorRes.value
      );

      const prInfo = await getPrInfo(
        pull_request as SimplePullRequest,
        repository,
        organization,
        sender,
        contributorRes
      );
      const prRes = await upsertDataToDB(Collections.ITEMS, prInfo);
      console.log('A PR has been updated in DB successfully.', prRes.value);

      break;
    }

    default: {
      console.log(
        'current action for pull request review comment is not in the parse candidate',
        event
      );

      break;
    }
  }
}
