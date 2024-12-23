// import all your job files here
import { logger, task } from '@trigger.dev/sdk/v3';

import type {
  CheckRunEvent,
  IssueCommentEvent,
  IssuesEvent,
  IssuesLabeledEvent,
  PullRequestEvent,
  PullRequestReviewEvent
} from '@octokit/webhooks-types';

import { isDev } from '$lib/config';
import config from '$lib/server/config';

import { client, discordApi } from '../client';
import { createJob as createPrJob } from './pull-requests';
import { createJob as createPrReviewJob } from './pull-requests-review';
import { createJob as createIssueJob } from './issues';
import { createJob as createIssueCreationJob } from './issues-creation';
import { createJob as createIssueCommentJob } from './issues-comment';
import {
  createJob as createCheckRunJob,
  createEventJob as createCheckEventJob,
  type EventSchema
} from './check-run';
import { getInstallationId, githubApp } from '../utils';

config.integrationsList.forEach((org) => {
  const issueCreationJob = task({
    id: `issue-creation-streaming_${org.id}${isDev ? '_dev' : ''}`,
    run: async (payload: IssuesEvent) => createIssueCreationJob(payload)
  });

  const issueCommentJob = task({
    // This is the unique identifier for your Job, it must be unique across all Jobs in your project
    id: `issue-comment-streaming_${org.id}${isDev ? '_dev' : ''}`,
    run: async (payload: IssueCommentEvent) => createIssueCommentJob(payload)
  });

  const issueLabelJob = task({
    // This is the unique identifier for your Job, it must be unique across all Jobs in your project
    id: `issue-label-streaming_${org.id}${isDev ? '_dev' : ''}`,
    run: async (payload: IssuesLabeledEvent) => createIssueJob(payload)
  });

  const pullRequestJob = task({
    // This is the unique identifier for your Job, it must be unique across all Jobs in your project
    id: `pull-requests-streaming_${org.id}${isDev ? '_dev' : ''}`,
    run: async (payload: PullRequestEvent) => createPrJob(payload)
  });

  const pullRequestReviewJob = task({
    // This is the unique identifier for your Job, it must be unique across all Jobs in your project
    id: `pull-requests-review-streaming_${org.id}${isDev ? '_dev' : ''}`,
    run: async (payload: PullRequestReviewEvent) => createPrReviewJob(payload)
  });

  const customEventJob = task({
    id: `custom-event-streaming_${org.id}${isDev ? '_dev' : ''}`,
    run: async (payload: EventSchema) => createCheckEventJob(payload)
  });

  const checkRunJob = task({
    id: `check_run_streaming_${org.id}${isDev ? '_dev' : ''}`,
    run: async (payload: CheckRunEvent) => createCheckRunJob(payload)
  });
});

if (!isDev) {
  const discordJob = task({
    id: `discord-send-message`,
    run: async (payload: { content: string }) => {
      const { content } = payload;

      await logger.trace('Discord send message', async () => {
        const channelsAPI = discordApi.channels;
        await channelsAPI.createMessage(config.discord.channelId, { content });
      });
    }
  });

  const githubBugReportJob = task({
    id: 'github-create-bug-report-issue',
    run: async (payload: { content: string; title: string }) => {
      const { content, title } = payload;

      const targetIssueRepo = 'pr-time-tracker';
      const targetIssueOwner = 'holdex';

      const orgDetails = await logger.trace('get org installation', async () => {
        const { data } = await getInstallationId(targetIssueOwner);
        return data;
      });

      await logger.trace('create bug report issue', async () => {
        const octokit = await githubApp.getInstallationOctokit(orgDetails.id);
        const res = await octokit.rest.issues.create({
          owner: targetIssueOwner,
          repo: targetIssueRepo,
          title,
          body: content,
          labels: ['bug']
        });
        return res.data;
      });
    }
  });

  client.on('runFailed', (notification) => {
    const content = `${notification.job.id} failed to run. More info on https://cloud.trigger.dev/orgs/${notification.organization.slug}/projects/${notification.project.slug}/jobs/${notification.job.id}/runs/${notification.id}/trigger`;

    client.sendEvent({
      name: 'discord-send-message',
      payload: {
        content
      }
    });
    client.sendEvent({
      name: 'github-create-bug-report-issue',
      payload: {
        notification,
        title: `Job ${notification.job.id} failed to run`,
        content
      }
    });
  });
}
