import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Github } from '@trigger.dev/github';

import type { PullRequestEvent } from '$lib/server/github';
import { contributors, items } from '$lib/server/mongo/collections';

import { client } from '../';
import { getContributorInfo, getPrInfo, github, events, getSubmissionStatus } from './util';

// Your first job
// This Job will be triggered by an event, log a joke to the console, and then wait 5 seconds before logging the punchline
client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project
  id: 'pull-requests-streaming_clearpool',
  name: 'Streaming pull requests for Github using app',
  version: '0.0.1',
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: github.triggers.org({
    event: events.onPullRequest,
    org: 'clearpool-finance'
  }),
  integrations: {
    github
  },
  run: async (payload, io, ctx) => createJob(payload, io, ctx)
});

client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project
  id: 'pull-requests-streaming_holdex',
  name: 'Streaming pull requests for Github using app',
  version: '0.0.1',
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: github.triggers.org({
    event: events.onPullRequest,
    org: 'holdex'
  }),
  integrations: {
    github
  },
  run: async (payload, io, ctx) => createJob(payload, io, ctx)
});

client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project
  id: 'pull-requests-streaming_ithaca_interface',
  name: 'Streaming pull requests for Github using app',
  version: '0.0.1',
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: github.triggers.repo({
    event: events.onPullRequest,
    owner: 'ithaca-protocol',
    repo: 'ithaca-interface'
  }),
  run: async (payload, io, ctx) => createJob(payload, io, ctx)
});

async function createJob(
  payload: PullRequestEvent,
  io: IOWithIntegrations<{ github: Github } | any>,
  ctx: TriggerContext
) {
  const { action, pull_request, repository, organization, sender } = payload;

  switch (action) {
    case 'opened':
    case 'edited':
    case 'synchronize':
    case 'closed': {
      const { user } = pull_request;
      let contributorInfo;

      if (action === 'opened' || action === 'closed') {
        contributorInfo = getContributorInfo(user);
      } else {
        contributorInfo = getContributorInfo(sender);
      }
      const contributor = await contributors.update(contributorInfo);

      await io.wait('wait for first call', 5);

      await items.update(
        await getPrInfo(pull_request, repository, organization, sender, contributor),
        { onCreateIfNotExist: true }
      );
      break;
    }
    case 'review_requested': {
      if (io.github !== undefined) {
        const submission = await getSubmissionStatus(pull_request.user.id, pull_request.id);
        await io.github.createIssueComment('create comment', {
          owner: repository.owner.login,
          repo: repository.name,
          issueNumber: pull_request.number, // the number of the issue
          body: submission
            ? `Pull request submission provided: ${submission.hours} hours`
            : 'Pull request submission is required to be able to get reviewed' // the contents of the comment
        });
        return { payload, ctx };
      }
      break;
    }
    default: {
      io.logger.log('current action for pull request is not in the parse candidate', payload);
    }
  }
}
