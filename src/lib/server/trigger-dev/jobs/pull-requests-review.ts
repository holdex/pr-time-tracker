import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';

import type { PullRequestReviewEvent } from '$lib/server/github';
import { contributors, items } from '$lib/server/mongo/collections';
import { insertEvent } from '$lib/server/gcloud';

import { getContributorInfo, getPrInfo } from './util';

import { EventType } from '$lib/@types';

export async function createJob(
  payload: PullRequestReviewEvent,
  io: IOWithIntegrations<any>,
  ctx: TriggerContext
) {
  const { action, pull_request, repository, organization, sender, review } = payload;

  switch (action) {
    case 'submitted': {
      const contributor = await contributors.update(getContributorInfo(sender));
      await io.wait('wait for first call', 5);

      // store these events in gcloud
      if (review.state === 'approved' || review.state === 'changes_requested') {
        await insertEvent({
          action: review.state === 'approved' ? EventType.PR_APPROVED : EventType.PR_REJECTED,
          id: pull_request.id,
          index: 1,
          organization: organization?.login || 'holdex',
          owner: pull_request.user.login,
          repository: repository.name,
          sender: pull_request.user.login,
          title: pull_request.title,
          created_at: pull_request.created_at,
          updated_at: pull_request.updated_at
        });
      }

      await items.update(
        await getPrInfo(pull_request, repository, organization, sender, contributor),
        { onCreateIfNotExist: true }
      );
      break;
    }
    default: {
      io.logger.log('current action for pull request is not in the parse candidate', payload);
    }
  }
}
