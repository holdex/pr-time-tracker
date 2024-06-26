// import all your job files here
import { type IOWithIntegrations, eventTrigger } from '@trigger.dev/sdk';
import zod from 'zod';

import { isDev } from '$lib/config';
import config from '$lib/server/config';

import { client, github, events, discordApi, type Autoinvoicing } from '../client';
import { createJob as createPrJob } from './pull-requests';
import { createJob as createPrReviewJob } from './pull-requests-review';
import { createJob as createIssueJob } from './issues';
import { createJob as createCheckRunJob, createEventJob as createCheckEventJob } from './check-run';

config.integrationsList.forEach((org) => {
  client.defineJob({
    // This is the unique identifier for your Job, it must be unique across all Jobs in your project
    id: `issue-label-streaming_${org.id}${isDev ? '_dev' : ''}`,
    name: 'Streaming issue labeling for Github using app',
    version: '0.0.1',
    trigger: github.triggers.org({
      event: events.onIssue,
      org: org.name
    }),
    integrations: { github },
    run: async (payload, io, ctx) =>
      createIssueJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx, org)
  });

  client.defineJob({
    // This is the unique identifier for your Job, it must be unique across all Jobs in your project
    id: `pull-requests-streaming_${org.id}${isDev ? '_dev' : ''}`,
    name: 'Streaming pull requests for Github using app',
    version: '0.0.1',
    trigger: github.triggers.org({
      event: events.onPullRequest,
      org: org.name
    }),
    integrations: { github },
    run: async (payload, io, ctx) =>
      createPrJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx)
  });

  client.defineJob({
    // This is the unique identifier for your Job, it must be unique across all Jobs in your project
    id: `pull-requests-review-streaming_${org.id}${isDev ? '_dev' : ''}`,
    name: 'Streaming pull requests review for Github using app',
    version: '0.0.1',
    trigger: github.triggers.org({
      event: events.onPullRequestReview,
      org: org.name
    }),
    integrations: { github },
    run: async (payload, io, ctx) =>
      createPrReviewJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx)
  });

  client.defineJob({
    id: `custom-event-streaming_${org.id}${isDev ? '_dev' : ''}`,
    name: 'Streaming custom events for Github using app',
    version: '0.0.1',
    trigger: eventTrigger({
      name: `${org.name}_pr_submission.created`,
      schema: zod.object({
        organization: zod.string(),
        repo: zod.string(),
        prId: zod.number(),
        prNumber: zod.number(),
        checkRunId: zod.number(),
        senderId: zod.number(),
        senderLogin: zod.string()
      })
    }),
    concurrencyLimit: 1,
    integrations: { github },
    run: async (payload, io, ctx) =>
      createCheckEventJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx)
  });

  client.defineJob({
    id: `check_run_streaming_${org.id}${isDev ? '_dev' : ''}`,
    name: 'Streaming check runs for Github using app',
    version: '0.0.1',
    trigger: github.triggers.org({
      event: events.onCheckRun,
      org: org.name
    }),
    concurrencyLimit: 1,
    integrations: { github },
    run: async (payload, io, ctx) =>
      createCheckRunJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx)
  });
});

client.defineJob({
  id: `discord-send-message${isDev ? '_dev' : ''}`,
  name: 'Send Discord message',
  version: '0.0.1',
  trigger: eventTrigger({
    name: 'discord-send-message',
    schema: zod.object({
      content: zod.string()
    })
  }),
  run: async (payload, io) => {
    const { content } = payload;

    await io.runTask('Discord send message', async () => {
      const channelsAPI = discordApi.channels;
      await channelsAPI.createMessage(config.discord.channelId, { content });
    });
  }
});

client.on('runFailed', (notification) => {
  client.sendEvent({
    name: 'discord-send-message',
    payload: {
      content: `${notification.job.id} failed to run. More info on https://cloud.trigger.dev/orgs/${notification.organization.slug}/projects/${notification.project.slug}/jobs/${notification.job.id}/runs/${notification.id}/trigger`
    }
  });
});
