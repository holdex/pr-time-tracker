import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';

import type { ContributorSchema } from '$lib/server/mongo/operations';
import type { PullRequestReviewEvent } from '$lib/server/github';

import { client } from '../';
import { getContributorInfo, getPrInfo, upsertDataToDB, github, events } from './util';

import { CollectionNames } from '$lib/@types';

// Your first job
// This Job will be triggered by an event, log a joke to the console, and then wait 5 seconds before logging the punchline
client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project
  id: 'pull-requests-review-streaming_clearpool',
  name: 'Streaming pull requests review for Github using app',
  version: '0.0.1',
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: github.triggers.org({
    event: events.onPullRequestReview,
    org: 'clearpool-finance'
  }),
  run: async (payload, io, ctx) => createJob(payload, io, ctx)
});

client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project
  id: 'pull-requests-review-streaming_holdex',
  name: 'Streaming pull requests review for Github using app',
  version: '0.0.1',
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: github.triggers.org({
    event: events.onPullRequestReview,
    org: 'holdex'
  }),
  run: async (payload, io, ctx) => createJob(payload, io, ctx)
});

async function createJob(
  payload: PullRequestReviewEvent,
  io: IOWithIntegrations<any>,
  ctx: TriggerContext
) {
  const { action, pull_request, repository, organization, sender } = payload;

  switch (action) {
    case 'submitted': {
      const contributorInfo = getContributorInfo(sender);
      const contributorsRes = await upsertDataToDB<ContributorSchema>(
        CollectionNames.CONTRIBUTORS,
        contributorInfo
      );
      await io.wait('wait for first call', 5);

      const prInfo = await getPrInfo(
        pull_request,
        repository,
        organization,
        sender,
        contributorsRes
      );
      await upsertDataToDB(CollectionNames.ITEMS, prInfo);
      break;
    }
    default: {
      io.logger.log('current action for pull request is not in the parse candidate', payload);
    }
  }
}
