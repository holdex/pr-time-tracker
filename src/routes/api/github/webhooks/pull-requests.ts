import type { PullRequestEvent } from '$lib/server/github';
import type { ContributorCollection } from '$lib/server/mongo/operations';
import { Collections } from '$lib/server/mongo/operations';

import { getContributorInfo, getPrInfo, upsertDataToDB } from './util';

const parsePullRequestEvents = async (event: PullRequestEvent) => {
  const { action, pull_request, repository, organization, sender } = event;

  switch (action) {
    case 'opened':
    case 'edited':
    case 'synchronize':
    case 'closed': {
      const { user } = pull_request;
      let contributorInfo: ContributorCollection;

      if (action === 'opened' || action === 'closed') {
        contributorInfo = getContributorInfo(user);
      } else {
        contributorInfo = getContributorInfo(sender);
      }

      const contributorRes = await upsertDataToDB(Collections.CONTRIBUTORS, contributorInfo);
      console.log(
        'Contributor of the PR has been updated in DB successfully.',
        contributorRes.value
      );

      const prInfo = await getPrInfo(
        pull_request,
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
      console.log('current action for pull request is not in the parse candidate', event);

      break;
    }
  }
};

export default parsePullRequestEvents;
