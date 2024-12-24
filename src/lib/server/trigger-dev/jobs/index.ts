// import all your job files here
import { logger, type Task, task } from '@trigger.dev/sdk/v3';

import type {
  CheckRunEvent,
  IssueCommentEvent,
  IssuesEvent,
  IssuesLabeledEvent,
  PullRequestEvent,
  PullRequestReviewEvent
} from '@octokit/webhooks-types';
import type { NotificationEvents } from '@trigger.dev/sdk';

import { isDev } from '$lib/config';
import config from '$lib/server/config';
import type { SupportedGitHubEvent } from '$lib/constants';

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

function defineJob<TIdentifier extends string, TInput = void, TOutput = unknown>(args: {
  task: Task<TIdentifier, TInput, TOutput>;
  triggerOnEvent: SupportedGitHubEvent | null;
  triggerOnActions?: string[];
}) {
  return args;
}

function createOrgJob(org: { id: string; name: string }) {
  const issueCreationJob = defineJob({
    task: task({
      id: `issue-creation-streaming_${org.id}${isDev ? '_dev' : ''}`,
      run: async (payload: IssuesEvent) => createIssueCreationJob(payload)
    }),
    triggerOnEvent: 'issues'
  });

  const issueCommentJob = defineJob({
    task: task({
      id: `issue-comment-streaming_${org.id}${isDev ? '_dev' : ''}`,
      run: async (payload: IssueCommentEvent) => createIssueCommentJob(payload)
    }),
    triggerOnEvent: 'issue_comment',
    triggerOnActions: ['created', 'edited', 'deleted']
  });

  const issueLabelJob = defineJob({
    task: task({
      id: `issue-label-streaming_${org.id}${isDev ? '_dev' : ''}`,
      run: async (payload: IssuesLabeledEvent) => createIssueJob(payload)
    }),
    triggerOnEvent: 'issues',
    triggerOnActions: ['labeled']
  });

  const pullRequestJob = defineJob({
    task: task({
      id: `pull-requests-streaming_${org.id}${isDev ? '_dev' : ''}`,
      run: async (payload: PullRequestEvent) => createPrJob(payload)
    }),
    triggerOnEvent: 'pull_request'
  });

  const pullRequestReviewJob = defineJob({
    task: task({
      id: `pull-requests-review-streaming_${org.id}${isDev ? '_dev' : ''}`,
      run: async (payload: PullRequestReviewEvent) => createPrReviewJob(payload)
    }),
    triggerOnEvent: 'pull_request_review'
  });

  const customEventJob = defineJob({
    task: task({
      id: `custom-event-streaming_${org.id}${isDev ? '_dev' : ''}`,
      run: async (payload: EventSchema) => createCheckEventJob(payload)
    }),
    triggerOnEvent: null
  });

  const checkRunJob = defineJob({
    task: task({
      id: `check_run_streaming_${org.id}${isDev ? '_dev' : ''}`,
      run: async (payload: CheckRunEvent) => createCheckRunJob(payload)
    }),
    triggerOnEvent: 'check_run'
  });

  return {
    issueCreationJob,
    issueCommentJob,
    issueLabelJob,
    pullRequestJob,
    pullRequestReviewJob,
    checkRunJob,
    customEventJob
  };
}

const orgJobs: Record<string, ReturnType<typeof createOrgJob>> = {};
config.integrationsList.forEach((org) => {
  orgJobs[org.name] = createOrgJob(org);
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
    run: async (payload: {
      content: string;
      title: string;
      notification: Parameters<NotificationEvents['runFailed']>[0];
    }) => {
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

    discordJob.trigger({ content });
    githubBugReportJob.trigger({
      notification,
      title: `Job ${notification.job.id} failed to run`,
      content
    });
  });
}

export function getOrgJob(org: string) {
  const orgJob = orgJobs[org];
  if (!orgJob) {
    throw new Error(`Org job not found for ${org}`);
  }
  return orgJob;
}
